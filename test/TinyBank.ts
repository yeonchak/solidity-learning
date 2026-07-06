import hre from "hardhat";
import { expect } from "chai";
import { DECIMALS, MINTING_AMOUNT } from "./constant";
import { MyToken, TinyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("TinyBank", () => {
  let signers: HardhatEthersSigner[];
  let myTokenC: MyToken;
  let tinyBankC: TinyBank;

  beforeEach(async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
    tinyBankC = await hre.ethers.deployContract("TinyBank", [
      await myTokenC.getAddress(),
      [
        signers[0].address,
        signers[1].address,
        signers[2].address,
        signers[3].address,
        signers[4].address,
      ],
    ]);
    await myTokenC.setManager(tinyBankC.getAddress());
  });

  async function confirmAllManagers() {
    for (let i = 0; i < 5; i++) {
      await tinyBankC.connect(signers[i]).confirm();
    }
  }

  describe("Initialized state check", () => {
    it("should return totalStaked 0", async () => {
      expect(await tinyBankC.totalStaked()).equal(0);
    });
    it("should return staked 0 amount of singer0", async () => {
      expect(await tinyBankC.staked(signers[0].address)).equal(0);
    });
    it("should register signer0 through signer4 as managers", async () => {
      for (let i = 0; i < 5; i++) {
        expect(await tinyBankC.isManager(signers[i].address)).equal(true);
      }
      expect(await tinyBankC.isManager(signers[5].address)).equal(false);
    });
  });

  describe("Staking", async () => {
    it("should return staked amount", async () => {
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      expect(await tinyBankC.staked(signers[0].address)).equal(stakingAmount);
      expect(await tinyBankC.totalStaked()).equal(stakingAmount);
      expect(await myTokenC.balanceOf(await tinyBankC.getAddress())).equal(
        await tinyBankC.totalStaked(),
      );
    });
  });

  describe("Withdraw", () => {
    it("should return 0 staked after withdrawing total token", async () => {
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);
      await tinyBankC.withdraw(stakingAmount);
      expect(await tinyBankC.staked(signers[0].address)).equal(0);
    });
  });

  describe("Reward", () => {
    it("should reward 1MT every blocks", async () => {
      const stakingAmount = hre.ethers.parseUnits("50", DECIMALS);
      await myTokenC.approve(await tinyBankC.getAddress(), stakingAmount);
      await tinyBankC.stake(stakingAmount);

      const BLOCKS = 5n;
      const transferAmount = hre.ethers.parseUnits("1", DECIMALS);
      for (let i = 0; i < 5; i++) {
        await myTokenC.transfer(transferAmount, signers[0].address);
      }

      await tinyBankC.withdraw(stakingAmount);
      expect(await myTokenC.balanceOf(signers[0].address)).equal(
        hre.ethers.parseUnits(
          (BLOCKS + MINTING_AMOUNT + 1n).toString(),
          DECIMALS,
        ),
      );
    });

    it("should revert when signer5 changes rewardPerBlock", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        tinyBankC.connect(signers[5]).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("You are not a manager");
    });

    it("should revert when not all managers confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await tinyBankC.connect(signers[0]).confirm();
      await tinyBankC.connect(signers[1]).confirm();
      await tinyBankC.connect(signers[2]).confirm();

      await expect(
        tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange),
      ).to.be.revertedWith("Not all confirmed yet");
    });

    it("should change rewardPerBlock after all managers confirmed", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await confirmAllManagers();
      await tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange);

      expect(await tinyBankC.rewardPerBlock()).equal(rewardToChange);
    });

    it("should reset confirmations after changing rewardPerBlock", async () => {
      const rewardToChange = hre.ethers.parseUnits("10000", DECIMALS);

      await confirmAllManagers();
      await tinyBankC.connect(signers[0]).setRewardPerBlock(rewardToChange);

      for (let i = 0; i < 5; i++) {
        expect(await tinyBankC.confirmed(i)).equal(false);
      }
    });
  });
});
