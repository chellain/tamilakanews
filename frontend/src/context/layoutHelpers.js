export const findPageByName = (layout, catName) => {
  if (!layout?.pages || !catName) return null;
  return layout.pages.find((p) => p.catName === catName) || null;
};

const findNestedContainer = (containers, targetId) => {
  for (const cont of containers || []) {
    if (cont.id === targetId) return cont;
    if (cont.nestedContainers?.length) {
      const found = findNestedContainer(cont.nestedContainers, targetId);
      if (found) return found;
    }
  }
  return null;
};

export const findContainer = ({
  layout,
  catName,
  containerId,
  isNested = false,
  parentContainerId = null,
}) => {
  const page = findPageByName(layout, catName);
  if (!page) return null;

  if (isNested && parentContainerId) {
    const parent = findNestedContainer(page.containers || [], parentContainerId);
    return parent?.nestedContainers?.find((nc) => nc.id === containerId) || null;
  }

  return (page.containers || []).find((c) => c.id === containerId) || null;
};

export const findSlider = ({
  layout,
  catName,
  sliderId,
  isNested = false,
  parentContainerId = null,
  containerId = null,
}) => {
  const page = findPageByName(layout, catName);
  if (!page) return null;

  if (isNested && parentContainerId && containerId) {
    const parent = findNestedContainer(page.containers || [], parentContainerId);
    const nested = parent?.nestedContainers?.find((nc) => nc.id === containerId);
    return nested?.sliders?.find((s) => s.id === sliderId) || null;
  }

  if (containerId) {
    const container = (page.containers || []).find((c) => c.id === containerId);
    return container?.sliders?.find((s) => s.id === sliderId) || null;
  }

  return (page.sliders || []).find((s) => s.id === sliderId) || null;
};

export const findLine = ({
  layout,
  catName,
  containerId = null,
  parentContainerId = null,
}) => {
  const page = findPageByName(layout, catName);
  if (!page) return [];

  if (containerId && parentContainerId) {
    const parent = findNestedContainer(page.containers || [], parentContainerId);
    const nested = parent?.nestedContainers?.find((nc) => nc.id === containerId);
    return nested?.lines || [];
  }

  if (containerId) {
    const container = (page.containers || []).find((c) => c.id === containerId);
    return container?.lines || [];
  }

  return page.lines || [];
};

export const findSlotItem = ({
  layout,
  catName,
  containerId,
  slotId,
  isNested = false,
  parentContainerId = null,
}) => {
  const container = findContainer({ layout, catName, containerId, isNested, parentContainerId });
  if (!container) return null;
  return (container.items || []).find((i) => i.slotId === slotId) || null;
};

export const findSliderSlotItem = ({
  layout,
  catName,
  sliderId,
  slotId,
  isNested = false,
  parentContainerId = null,
  containerId = null,
}) => {
  const slider = findSlider({
    layout,
    catName,
    sliderId,
    isNested,
    parentContainerId,
    containerId,
  });
  return slider?.items?.find((item) => item.slotId === slotId) || null;
};

export const updateSlotItem = ({
  layout,
  catName,
  containerId,
  slotId,
  isNested = false,
  parentContainerId = null,
  updater,
}) => {
  if (!layout?.pages || !updater) return layout;

  const next = { ...layout };
  next.pages = (layout.pages || []).map((page) => {
    if (page.catName !== catName) return page;

    const updateContainers = (containers) =>
      (containers || []).map((cont) => {
        if (isNested && parentContainerId && cont.id !== parentContainerId) {
          if (cont.nestedContainers?.length) {
            return { ...cont, nestedContainers: updateContainers(cont.nestedContainers) };
          }
          return cont;
        }

        if (isNested && parentContainerId && cont.id === parentContainerId) {
          const nestedContainers = (cont.nestedContainers || []).map((nc) => {
            if (nc.id !== containerId) return nc;
            return {
              ...nc,
              items: (nc.items || []).map((item) =>
                item.slotId === slotId ? updater(item) : item
              ),
            };
          });
          return { ...cont, nestedContainers };
        }

        if (!isNested && cont.id === containerId) {
          return {
            ...cont,
            items: (cont.items || []).map((item) =>
              item.slotId === slotId ? updater(item) : item
            ),
          };
        }

        if (cont.nestedContainers?.length) {
          return { ...cont, nestedContainers: updateContainers(cont.nestedContainers) };
        }

        return cont;
      });

    return { ...page, containers: updateContainers(page.containers) };
  });

  return next;
};
