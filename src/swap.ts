import BN from "bn.js";

export interface CryptoUtil {
  derive_private_key: (seed: Uint8Array, suffix: Uint8Array) => Uint8Array;
  get_public_key: (privKey: Uint8Array) => Uint8Array;
  sign: (msg: Uint8Array, publicKey: Uint8Array) => Uint8Array;
}

export enum CommandOp {
  Deposit = 0,
  Withdraw = 1,
  Swap = 2,
  Retrieve = 3,
  Supply = 4,
  AddPool = 5,
  SetKey = 6,
}

export class SwapHelper<t> {
  privateKey: Uint8Array;
  send: (method: string, ...args: any[]) => Promise<t>;
  cryptoUtil: CryptoUtil;

  constructor(
    account: string,
    send: (method: string, ...args: any[]) => Promise<t>,
    cryptoUtil: CryptoUtil
  ) {
    this.send = send;
    this.cryptoUtil = cryptoUtil;
    this.privateKey = this.cryptoUtil.derive_private_key(
      new TextEncoder().encode(account),
      new TextEncoder().encode("/delphinus/swap")
    );
  }

  setKey() {
    const derivedL2AccountPubKey = this.cryptoUtil.get_public_key(
      this.privateKey
    );
    return this.send("setKey", derivedL2AccountPubKey);
  }

  addPool(token0: BN, token1: BN, nonce: BN) {
    const buf = new Uint8Array(81);

    buf.fill(0);
    buf[0] = CommandOp.AddPool;
    buf.set(nonce.toArray("be", 8), 1);
    buf.set(token0.toArray("be", 4), 9);
    buf.set(token1.toArray("be", 4), 13);

    const s = this.cryptoUtil.sign(buf, this.privateKey);
    console.log(s);

    return this.send("addPool", s, token0, token1, nonce);
  }

  deposit(
    accountIndex: BN,
    tokenIndex: BN,
    amount: BN,
    l1_tx_hash: BN,
    nonce: BN
  ) {
    const buf = new Uint8Array(81);

    buf.fill(0);
    buf[0] = CommandOp.Deposit;
    buf.set(nonce.toArray("be", 8), 1);
    buf.set(accountIndex.toArray("be", 4), 9);
    buf.set(tokenIndex.toArray("be", 4), 13);
    buf.set(amount.toArray("be", 32), 17);

    const s = this.cryptoUtil.sign(buf, this.privateKey);

    return this.send(
      "deposit",
      s,
      accountIndex.toString(10),
      tokenIndex.toString(10),
      amount.toString(10),
      l1_tx_hash.toString(10),
      nonce.toString(10)
    );
  }

  withdraw(
    accountIndex: BN,
    tokenIndex: BN,
    amount: BN,
    l1Account: BN,
    nonce: BN
  ) {
    const buf = new Uint8Array(81);

    buf.fill(0);
    buf[0] = CommandOp.Withdraw;
    buf.set(nonce.toArray("be", 8), 1);
    buf.set(accountIndex.toArray("be", 4), 9);
    buf.set(tokenIndex.toArray("be", 4), 13);
    buf.set(amount.toArray("be", 32), 17);
    buf.set(l1Account.toArray("be", 32), 49);

    const s = this.cryptoUtil.sign(buf, this.privateKey);

    return this.send(
      "withdraw",
      s,
      tokenIndex.toString(10),
      amount.toString(10),
      l1Account.toString(10),
      nonce.toString(10)
    );
  }

  swap(
    accountIndex: BN,
    poolIndex: BN,
    reverse: BN,
    amount: BN,
    nonce: BN
  ) {
    const buf = new Uint8Array(81);

    buf.fill(0);
    buf[0] = CommandOp.Swap;
    buf.set(nonce.toArray("be", 8), 1);
    buf.set(accountIndex.toArray("be", 4), 9);
    buf.set(poolIndex.toArray("be", 4), 13);
    buf.set(reverse.toArray("be", 32), 17);
    buf.set(amount.toArray("be", 32), 49);

    const s = this.cryptoUtil.sign(buf, this.privateKey);

    return this.send(
      "swap",
      s,
      poolIndex.toString(10),
      reverse.toString(10),
      amount.toString(10),
      nonce.toString(10)
    );
  }

  poolSupply(
    accountIndex: BN,
    poolIndex: BN,
    amount0: BN,
    amount1: BN,
    nonce: BN
  ) {
    const buf = new Uint8Array(81);

    buf.fill(0);
    buf[0] = CommandOp.Supply;
    buf.set(nonce.toArray("be", 8), 1);
    buf.set(accountIndex.toArray("be", 4), 9);
    buf.set(poolIndex.toArray("be", 4), 13);
    buf.set(amount0.toArray("be", 32), 17);
    buf.set(amount1.toArray("be", 32), 49);

    const s = this.cryptoUtil.sign(buf, this.privateKey);

    return this.send(
      "poolSupply",
      s,
      poolIndex.toString(10),
      amount0.toString(10),
      amount1.toString(10),
      nonce.toString(10)
    );
  }

  poolRetrieve(
    accountIndex: BN,
    poolIndex: BN,
    amount0: BN,
    amount1: BN,
    nonce: BN
  ) {
    const buf = new Uint8Array(81);

    buf.fill(0);
    buf[0] = CommandOp.Retrieve;
    buf.set(nonce.toArray("be", 8), 1);
    buf.set(accountIndex.toArray("be", 4), 9);
    buf.set(poolIndex.toArray("be", 4), 13);
    buf.set(amount0.toArray("be", 32), 17);
    buf.set(amount1.toArray("be", 32), 49);

    const s = this.cryptoUtil.sign(buf, this.privateKey);

    return this.send(
      "poolRetrieve",
      s,
      poolIndex.toString(10),
      amount0.toString(10),
      amount1.toString(10),
      nonce.toString(10)
    );
  }
}
