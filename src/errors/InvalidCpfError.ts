export class InvalidCpfError extends Error {
  constructor(cpf: string) {
    super(`The cpf '${cpf}' is invalid.`);
  }
}
