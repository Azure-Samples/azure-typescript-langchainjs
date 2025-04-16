export async function waiter(ms: number): Promise<void> {
  // waiting for ms milliseconds
  console.log(`Waiting for ${ms} milliseconds`);
  return new Promise((resolve) => setTimeout(resolve, ms));
}
