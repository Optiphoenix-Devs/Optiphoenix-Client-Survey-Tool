const measure = performance.measure.bind(performance);

performance.measure = ((
  name: string,
  startOrOptions?: string | PerformanceMeasureOptions,
  endMark?: string
) => {
  try {
    return startOrOptions === undefined
      ? measure(name)
      : endMark === undefined
        ? measure(name, startOrOptions)
        : measure(name, startOrOptions as string, endMark);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("negative time stamp")) return undefined;
    throw error;
  }
}) as typeof performance.measure;
