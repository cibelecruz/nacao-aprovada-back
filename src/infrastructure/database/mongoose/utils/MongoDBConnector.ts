import mongoose from "mongoose";
const { ConnectionStates, connect, connection } = mongoose;


export class MongoDBConnectorManager {
  private readonly _uri: string;
  private _connection: mongoose.Connection;

  constructor(uri: string | undefined) {
    const uriValidatorRegex =
      /^mongodb.*:\/\/[A-Za-z0-9].*:.+@.+\..+\.mongodb\.net/;
    if (!uri || !uriValidatorRegex.test(uri)) {
      throw new Error(`Invalid connection string '${uri ?? ''}'`);
    }
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
