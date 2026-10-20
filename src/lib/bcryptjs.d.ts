declare module 'bcryptjs' {
  export function hash(data: string | Buffer, saltOrRounds: string | number, progressCallback?: Function): Promise<string>;
  export function compare(data: string | Buffer, encrypted: string, progressCallback?: Function): Promise<boolean>;
  export function genSalt(rounds?: number, minor?: number): Promise<string>;
  export function getRounds(hashed_password: string): number;
}
