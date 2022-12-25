export function panic(message?: string): never {
  throw new Error(message);
}

export function injectPanic(where: string, toInject: string) {
  return panic(`[${where}] ${toInject} is not provided`);
}
