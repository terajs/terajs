declare module "commander" {
  export class Command {
    constructor();
    name(name: string): this;
    description(description: string): this;
    version(version: string): this;
    command(command: string): this;
    option(flags: string, description: string, defaultValue?: string): this;
    action(fn: (...args: any[]) => void): this;
    parse(argv?: string[]): void;
  }
}
