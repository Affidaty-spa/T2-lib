import * as Errors from '../errors';
import { WebCrypto } from '../cryptography/webCrypto';
import { objectToBytes, bytesToObject } from '../utils';
import {
    EKeyParamsIds,
    mKeyPairParams,
} from '../cryptography/cryptoDefaults';
import { BaseECKey } from '../cryptography/baseECKey';
import {
    TxSchemas,
    TTxSchemaType,
    CommonParentTxData,
    ICommonParentTxDataUnnamedObject,
    ICommonParentTxDataObjectWithBuffers,
    ICommonParentTxDataObject,
} from './commonParentTxData';

const DEFAULT_SCHEMA = TxSchemas.ATOMIC_TX;

interface IBaseTxDataPublicKeyUnnamedObject extends Array<any> {
    /** Public key algorithm type. E.g. "ecdsa". */
    [0]: string;
    /** Public key curve type. E.g. 'secp384r1' */
    [1]: string;
    /** Actual value of the public key as "raw" bytes */
    [2]: Buffer;
}

export interface IBaseTxDataUnnamedObject extends ICommonParentTxDataUnnamedObject {
    /** Target AccountId */
    [1]: string;
    /** Max fuel that consumable by this transaction */
    [2]: number;
    /** Nonce */
    [3]: Buffer;
    /** Network name */
    [4]: string;
    /** Smart contract hash */
    [5]: Buffer | null;
    /** Smart contract method */
    [6]: string;
    /** Signer's public key */
    [7]: IBaseTxDataPublicKeyUnnamedObject;
    /** Bytes representing smart contract arguments */
    [8]: Buffer;
}

interface IBaseTxDataPublicKeyObjectWithBuffers {
    /** Public key algorithm type. E.g. "ecdsa". */
    type: string;
    /** Public key curve type. E.g. 'secp384r1' */
    curve: string;
    /** Actual value of the public key as "raw" bytes */
    value: Buffer;
}

export interface IBaseTxDataObjectWithBuffers extends ICommonParentTxDataObjectWithBuffers {
    /** Target AccountId */
    account: string;
    /** Max fuel that consumable by this transaction */
    maxFuel: number;
    /** Nonce */
    nonce: Buffer;
    /** Network name */
    network: string; // networkName
    /** Smart contract hash */
    contract: Buffer | null;
    /** Smart contract method */
    method: string;
    /** Signer's public key */
    caller: IBaseTxDataPublicKeyObjectWithBuffers;
    /** Bytes representing smart contract arguments */
    args: Buffer;
}

interface IBaseTxDataPublicKeyObject {
    /** Public key algorithm type. E.g. "ecdsa". */
    type: string;
    /** Public key curve type. E.g. 'secp384r1' */
    curve: string;
    /** Actual value of the public key as "raw" bytes */
    value: Uint8Array;
}

/** Structure returned by toObject() method. */
export interface IBaseTxDataObject extends ICommonParentTxDataObject {
    /** Target AccountId */
    account: string;
    /** Max fuel that consumable by this transaction */
    maxFuel: number;
    /** Nonce */
    nonce: Uint8Array;
    /** Network name */
    network: string;
    /** Smart contract hash */
    contract: Uint8Array | null;
    /** Smart contract method */
    method: string;
    /** Signer's public key */
    caller: IBaseTxDataPublicKeyObject;
    /** Bytes representing smart contract arguments */
    args: Uint8Array;
}

export class BaseTxData extends CommonParentTxData {
    protected _account: string;

    protected _maxFuel: number;

    protected _nonce: Buffer;

    protected _network: string;

    protected _contract: Buffer | null;

    protected _method: string;

    protected _args: Buffer;

    public static get defaultSchema(): string {
        return DEFAULT_SCHEMA;
    }

    constructor(schema: TTxSchemaType = DEFAULT_SCHEMA) {
        super(schema);
        this._account = '';
        this._maxFuel = 0;
        this._nonce = Buffer.from([]);
        this._network = '';
        this._contract = null;
        this._method = '';
        this._args = Buffer.from([]);
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public set accountId(id: string) {
        this._account = id;
    }

    /** Account ID of the target (receiving account) of the transaction. */
    public get accountId(): string {
        return this._account;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    public set maxFuel(maxFuel: number) {
        this._maxFuel = maxFuel;
    }

    /** Maximum amount of fuel that sender is ready to burn for this transaction. */
    public get maxFuel(): number {
        return this._maxFuel;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public set nonce(nonce: Buffer) {
        if (nonce.byteLength !== 8) {
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._nonce = nonce;
    }

    /** Random 8-bytes value as an anti-replay protection(Uint8Array). */
    public get nonce(): Buffer {
        return this._nonce;
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public set nonceHex(nonce: string) {
        if (nonce.length !== 16) { // two chars for each byte
            throw new Error(Errors.WRONG_TX_NONCE_LENGTH);
        }
        this._nonce = Buffer.from(nonce, 'hex');
    }

    /** Random 8-bytes value as an anti-replay protection(hex string). */
    public get nonceHex(): string {
        return this._nonce.toString('hex');
    }

    /** Automatically generates and sets new random nonce. */
    public genNonce(): void {
        const newNonce = new Uint8Array(8);
        WebCrypto.getRandomValues(newNonce);
        this._nonce = Buffer.from(newNonce);
    }

    /** Name of the network to which the transaction is addressed. */
    public set networkName(networkName: string) {
        this._network = networkName;
    }

    /** Name of the network to which the transaction is addressed. */
    public get networkName(): string {
        return this._network;
    }

    /** Smart contract hash, which will be invoked on target account. */
    public set smartContractHash(hash: Uint8Array) {
        if (hash.byteLength > 0) {
            this._contract = Buffer.from(hash);
        } else {
            this._contract = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account. */
    public get smartContractHash(): Uint8Array {
        if (this._contract) {
            return new Uint8Array(this._contract);
        }
        return Buffer.from([]);
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public set smartContractHashHex(hash: string) {
        if (hash.length > 0) {
            this._contract = Buffer.from(hash, 'hex');
        } else {
            this._contract = null;
        }
    }

    /** Smart contract hash, which will be invoked on target account(hex string). */
    public get smartContractHashHex(): string {
        if (this._contract) {
            return this._contract.toString('hex');
        }
        return '';
    }

    /** Smart contract hash, which will be invoked on target account. */
    public setSmartContractHash(hash: Buffer | string) {
        if (typeof hash === 'string') {
            this.smartContractHashHex = hash;
        } else {
            this.smartContractHash = hash;
        }
    }

    /** Method to call on the invoked smart contract */
    public set smartContractMethod(method: string) {
        this._method = method;
    }

    /** Method to call on the invoked smart contract */
    public get smartContractMethod(): string {
        return this._method;
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public set smartContractMethodArgs(passedArgs: any) {
        this._args = Buffer.from(objectToBytes(passedArgs));
    }

    /** Arguments that will be passed to invoked smart contract method (generic json object) */
    public get smartContractMethodArgs(): any {
        return bytesToObject(new Uint8Array(this._args));
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public set smartContractMethodArgsBytes(passedArgs: Uint8Array) {
        this._args = Buffer.from(passedArgs);
    }

    /** Arguments that will be passed to invoked smart contract method (Uint8Array) */
    public get smartContractMethodArgsBytes(): Uint8Array {
        return new Uint8Array(this._args);
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public set smartContractMethodArgsHex(passedArgs: string) {
        this._args = Buffer.from(passedArgs, 'hex');
    }

    /** Arguments that will be passed to invoked smart contract method (hex string) */
    public get smartContractMethodArgsHex(): string {
        return this._args.toString('hex');
    }

    public toUnnamedObject(): Promise<IBaseTxDataUnnamedObject> {
        return new Promise((resolve, reject) => {
            const resultObj: IBaseTxDataUnnamedObject = [
                this._schema,
                this._account,
                this._maxFuel,
                this._nonce,
                this._network,
                this._contract,
                this._method,
                [
                    '',
                    '',
                    Buffer.from([]),
                ],
                this._args,
            ];
            if (this._signerPubKey.paramsId === EKeyParamsIds.EMPTY) {
                return resolve(resultObj);
            }
            this._signerPubKey.getRaw()
                .then((rawKeyBytes: Uint8Array) => {
                    const underscoreIndex = this._signerPubKey.paramsId.indexOf('_');
                    if (underscoreIndex > -1) {
                        resultObj[7][0] = this._signerPubKey.paramsId.slice(0, underscoreIndex);
                        resultObj[7][1] = this._signerPubKey.paramsId.slice(underscoreIndex + 1);
                    } else {
                        resultObj[7][0] = this._signerPubKey.paramsId;
                    }
                    resultObj[7][2] = Buffer.from(rawKeyBytes);
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObjectWithBuffers(): Promise<IBaseTxDataObjectWithBuffers> {
        return new Promise((resolve, reject) => {
            this.toUnnamedObject()
                .then((unnamedObject: IBaseTxDataUnnamedObject) => {
                    const resultObj: IBaseTxDataObjectWithBuffers = {
                        schema: unnamedObject[0],
                        account: unnamedObject[1],
                        maxFuel: unnamedObject[2],
                        nonce: unnamedObject[3],
                        network: unnamedObject[4],
                        contract: unnamedObject[5],
                        method: unnamedObject[6],
                        caller: {
                            type: unnamedObject[7][0],
                            curve: unnamedObject[7][1],
                            value: unnamedObject[7][2],
                        },
                        args: unnamedObject[8],
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public toObject(): Promise<IBaseTxDataObject> {
        return new Promise((resolve, reject) => {
            this.toObjectWithBuffers()
                .then((objBuffers: IBaseTxDataObjectWithBuffers) => {
                    const resultObj: IBaseTxDataObject = {
                        schema: this._schema,
                        account: objBuffers.account,
                        maxFuel: objBuffers.maxFuel,
                        nonce: new Uint8Array(objBuffers.nonce),
                        network: objBuffers.network,
                        contract: objBuffers.contract ? new Uint8Array(objBuffers.contract) : null,
                        method: objBuffers.method,
                        caller: {
                            type: objBuffers.caller.type,
                            curve: objBuffers.caller.curve,
                            value: new Uint8Array(objBuffers.caller.value),
                        },
                        args: new Uint8Array(objBuffers.args),
                    };
                    return resolve(resultObj);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromUnnamedObject(passedObj: IBaseTxDataUnnamedObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this._schema = passedObj[0];
            this._account = passedObj[1];
            this._maxFuel = passedObj[2];
            this._nonce = passedObj[3];
            this._network = passedObj[4];
            this._contract = passedObj[5];
            this._method = passedObj[6];
            let keyParamsId: string = passedObj[7][0];
            if (passedObj[7][1].length > 0) {
                keyParamsId += `_${passedObj[7][1]}`;
            }
            if (!mKeyPairParams.has(keyParamsId)) {
                return reject(new Error(Errors.IMPORT_TYPE_ERROR));
            }
            this._signerPubKey = new BaseECKey(
                mKeyPairParams.get(keyParamsId)!.publicKey,
            );
            this._args = passedObj[8];
            if (keyParamsId === EKeyParamsIds.EMPTY) {
                return resolve(true);
            }
            this._signerPubKey.importBin(new Uint8Array(passedObj[7][2]))
                .then((result) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObjectWithBuffers(passedObj: IBaseTxDataObjectWithBuffers): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const unnamedObject: IBaseTxDataUnnamedObject = [
                passedObj.schema,
                passedObj.account,
                passedObj.maxFuel,
                passedObj.nonce,
                passedObj.network,
                passedObj.contract ? passedObj.contract : null,
                passedObj.method,
                [
                    passedObj.caller.type,
                    passedObj.caller.curve,
                    passedObj.caller.value,
                ],
                passedObj.args,
            ];
            this.fromUnnamedObject(unnamedObject)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }

    public fromObject(passedObj: IBaseTxDataObject): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const objBuffers: IBaseTxDataObjectWithBuffers = {
                schema: passedObj.schema,
                account: passedObj.account,
                maxFuel: passedObj.maxFuel,
                nonce: Buffer.from(passedObj.nonce),
                network: passedObj.network,
                contract: passedObj.contract ? Buffer.from(passedObj.contract) : null,
                method: passedObj.method,
                caller: {
                    type: passedObj.caller.type,
                    curve: passedObj.caller.curve,
                    value: Buffer.from(passedObj.caller.value),
                },
                args: Buffer.from(passedObj.args),
            };
            this.fromObjectWithBuffers(objBuffers)
                .then((result: boolean) => {
                    return resolve(result);
                })
                .catch((error: any) => {
                    return reject(error);
                });
        });
    }
}
