package main

import (
	"context"
	"fmt"
	"log"
	"math/big"
	"os"
	"time"

	"github.com/ethereum/go-ethereum/ethclient"
)

// 最小 Go 链上区块高度轮询与确认数监听骨架（对应 M01.7 - M01.10）
// 运行前设置：export RPC_URL="https://ethereum-sepolia-rpc.publicnode.com"
func main() {
	rpcURL := os.Getenv("RPC_URL")
	if rpcURL == "" {
		rpcURL = "https://ethereum-sepolia-rpc.publicnode.com"
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	client, err := ethclient.DialContext(ctx, rpcURL)
	if err != nil {
		log.Fatalf("连接 RPC 失败: %v", err)
	}
	defer client.Close()

	head, err := client.BlockNumber(ctx)
	if err != nil {
		log.Fatalf("读取最新区块高度失败: %v", err)
	}

	const confirmations uint64 = 12
	var safeBlock uint64
	if head > confirmations {
		safeBlock = head - confirmations
	}

	block, err := client.BlockByNumber(ctx, new(big.Int).SetUint64(safeBlock))
	if err != nil {
		log.Fatalf("读取安全确认块失败: %v", err)
	}
	fmt.Printf("最新块高: %d | 安全确认块(%d确认): %d | 块哈希: %s | 交易数: %d\n",
		head, confirmations, safeBlock, block.Hash().Hex(), len(block.Transactions()))
}
