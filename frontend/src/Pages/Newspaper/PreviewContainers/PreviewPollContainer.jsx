import React, { useState } from "react";
import { voteOnPoll } from "../../../Api/layoutApi";
import { useSiteData } from "../../../context/SiteDataContext";
import { findSlotItem, updateSlotItem } from "../../../context/layoutHelpers";

/**
 * PreviewPollContainer
 *
 * Read-only renderable poll for the public newspaper view.
 * - No close / edit controls.
 * - Options are clickable -> registers a vote and persists to the backend.
 * - Supports both single and multiple-answer polls via allowMultiple.
 */
const PreviewPollContainer = ({
  catName,
  containerId,
  slotId,
  isNested = false,
  parentContainerId = null,
}) => {
  const { layout, updateLayoutLocal } = useSiteData();

  // Read poll data from layout
  const slot = findSlotItem({
    layout,
    catName,
    containerId,
    slotId,
    isNested,
    parentContainerId,
  });
  const pollData = slot?.pollData || null;

  // Track which options the user has already voted on (local only, per session)
  const [votedIndices, setVotedIndices] = useState([]);
  const [revealed, setRevealed] = useState(false);

  if (!pollData) return null;

  const getPercentage = (votes) => {
    if (!pollData.totalVotes) return 0;
    return Math.round((votes / pollData.totalVotes) * 100);
  };

  const applyPollUpdate = (nextPollData) => {
    updateLayoutLocal((prev) =>
      updateSlotItem({
        layout: prev,
        catName,
        containerId,
        slotId,
        isNested,
        parentContainerId,
        updater: (item) => ({ ...item, pollData: nextPollData }),
      })
    );
  };

  const handleVote = async (index) => {
    if (votedIndices.includes(index)) return;
    if (!pollData.allowMultiple && votedIndices.length > 0) return;

    const newOptions = pollData.options.map((opt, i) =>
      i === index ? { ...opt, votes: opt.votes + 1 } : opt
    );
    const newTotalVotes = newOptions.reduce((sum, opt) => sum + opt.votes, 0);

    const optimisticPoll = {
      ...pollData,
      options: newOptions,
      totalVotes: newTotalVotes,
    };

    applyPollUpdate(optimisticPoll);
    setVotedIndices((prev) => [...prev, index]);
    setRevealed(true);

    try {
      const updated = await voteOnPoll({
        catName,
        containerId,
        slotId,
        isNested,
        parentContainerId,
        optionIndex: index,
      });

      if (updated?.pollData) {
        applyPollUpdate(updated.pollData);
      }
    } catch (error) {
      console.error("Failed to persist poll vote:", error);
    }
  };

  const hasVoted = votedIndices.length > 0;

  return (
    <div className="preview-poll-wrapper">
      <div className="preview-poll-question">{pollData.question}</div>

      {!hasVoted && (
        <div className="preview-poll-hint">
          {pollData.allowMultiple ? "Choose one or more options" : "Choose one option"}
        </div>
      )}

      {pollData.options.map((option, index) => {
        const pct = getPercentage(option.votes);
        const isChosen = votedIndices.includes(index);

        if (!revealed) {
          return (
            <div
              key={index}
              className="preview-poll-option-unvoted"
              onClick={() => handleVote(index)}
            >
              <div className="preview-poll-option-unvoted-content">
                {option.text}
              </div>
            </div>
          );
        }

        return (
          <div
            key={index}
            className={`preview-poll-option-voted${isChosen ? " is-chosen" : ""}`}
            onClick={() => handleVote(index)}
            style={{ cursor: pollData.allowMultiple && !isChosen ? "pointer" : "default" }}
          >
            <div className="preview-poll-fill" style={{ width: `${pct}%` }} />
            <div className="preview-poll-option-voted-content">
              <div className="preview-poll-option-text">{option.text}</div>
              <div className="preview-poll-stats">
                <div className="preview-poll-pct">{pct}%</div>
                <div className="preview-poll-count">{option.votes}</div>
              </div>
            </div>
          </div>
        );
      })}

      {revealed && (
        <div className="preview-poll-total">
          {pollData.totalVotes} vote{pollData.totalVotes !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
};

export default PreviewPollContainer;
