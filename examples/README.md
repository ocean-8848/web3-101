# Web3-101 最小可运行代码脚手架（Examples）

本目录提供与《Web3 从 0 到 1》核心实战篇配套的最小可运行工程模板，方便直接本地运行与二次扩展：

| 目录 | 对应课程模块 | 技术栈 | 快速运行 |
|---|---|---|---|
| `foundry-vault/` | M02 智能合约 & M08 DeFi & M14 毕业项目 | Solidity + Foundry | `cd foundry-vault && forge test -vv` |
| `go-deposit-indexer/` | M01 区块链基础 & Go 后端（M01.8–M01.10） | Go + `go-ethereum` | `cd go-deposit-indexer && go run main.go` |
| `circom-preimage/` | M06 零知识证明与隐私计算（M06.3） | Circom 2 + snarkjs | `cd circom-preimage && circom preimage.circom --r1cs --wasm` |

> 说明：模板代码仅作教学与起步骨架，上主网前请严格对照手册各模块末尾的“生产环境清单”完成审计、时间锁与风控加固。
