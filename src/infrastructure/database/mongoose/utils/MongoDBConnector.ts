import mongoose from "mongoose";
const { ConnectionStates, connect, connection } = mongoose;


export class MongoDBConnectorManager {
  private readonly _uri: string;
  private _connection: mongoose.Connection;

  constructor(uri: string | undefined) {

    // Linha 10
    const uriValidatorRegex =
      /^(mongodb:\/\/)([\w.-]+(?:[\w.-]+)*@)?([\w.-]+(?:\.[\w.-]+)*):([0-9]{2,5})\/([a-zA-Z0-9_-]+)$/gm;
    // Linha 12: Temporariamente desativando a validação da regex para desenvolvimento local
    if (!uri /* || !uriValidatorRegex.test(uri) */) { // Mantenha o '!uri'
      throw new Error('Invalid connection string (URI is empty) ' + uri + '');
    }
    // Linha 13: A linha original que estava causando o erro de validação
    // throw new Error('Invalid connection string ' + uri + '');

    this._uri = uri;
    this._connection = connection;
  }

  async connect(options?: mongoose.ConnectOptions): Promise<void> {
    const { readyState } = this._connection;
    if (
      readyState === ConnectionStates.connected ||
      readyState === ConnectionStates.connecting
    ) {
      return;
    }
    await connect(this._uri, options);
  }

  async disconnect(): Promise<void> {
    return this._connection.close();
  }
}
