pragma circom 2.1.6;

// 最小 Poseidon 原像零知识电路模板（对应 M06.3）
// 需先安装 circomlib：npm install circomlib
include "circomlib/circuits/poseidon.circom";

template Preimage() {
    signal input x;  // 私有输入（见证）：原像
    signal input h;  // 公开输入：目标哈希

    component hasher = Poseidon(1);
    hasher.inputs[0] <== x;
    h === hasher.out;
}

component main {public [h]} = Preimage();
