const sleep = async (timeout: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, timeout));

const humanDelay = () => {
  const min = 4000;
  const max = 12000;
  return Math.floor(min + (max - min) * Math.pow(Math.random(), 0.6));
};

export { sleep, humanDelay };

export const getDelay = (retries: number) => Math.min(retries * 30000, 600000);
