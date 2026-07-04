import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { DECIMALS, MINTING_AMOUNT } from "./constant";

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      // 배포시 state 변경
      "MyToken",
      "MT",
      DECIMALS,
      MINTING_AMOUNT,
    ]);
  });
  describe("Basic state value check", () => {
    it("should return name", async () => {
      expect(await myTokenC.name()).equal("MyToken");
    });
    it("should return symbol", async () => {
      expect(await myTokenC.symbol()).equal("MT");
    });
    it("should return decimals", async () => {
      expect(await myTokenC.decimals()).equal(DECIMALS);
    });
    it("should return 100 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });
  });

  // 1MT = 1*10^18
  describe("Mint", () => {
    it("should return 1MT balance for signer 0", async () => {
      const signer0 = signers[0];
      expect(await myTokenC.balanceOf(signer0)).equal(
        MINTING_AMOUNT * 10n ** DECIMALS,
      );
    });

    // TDD: Test Driven Development
    it("should return or revert when minting infinitly", async () => {
      const hacker = signers[2];
      const mintingAgainAmount = hre.ethers.parseUnits("10000", DECIMALS);
      await expect(
        myTokenC.connect(hacker).mint(mintingAgainAmount, hacker.address),
      ).to.be.revertedWith("You are not authorized to manage this token");
    });
    /*
    it("should mint token when signer0 calls mint", async () => {
      const signer0 = signers[0];
      const mintingAgainAmount = hre.ethers.parseUnits("10", DECIMALS);

      await myTokenC.connect(signer0).mint(mintingAgainAmount, signer0.address);

      expect(await myTokenC.totalSupply()).to.equal(
        MINTING_AMOUNT * 10n ** DECIMALS + mintingAgainAmount,
      );

      expect(await myTokenC.balanceOf(signer0.address)).to.equal(
        MINTING_AMOUNT * 10n ** DECIMALS + mintingAgainAmount,
      );
    });
    */
  });

  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      // const tx =
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits("0.5", DECIMALS),
          signer1.address,
        ),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", DECIMALS),
        ); // 호출 시, transaction 생성

      expect(await myTokenC.balanceOf(signer1.address)).equal(
        // state 변경없이 읽기만 하는 function
        hre.ethers.parseUnits("0.5", DECIMALS),
      );

      const filter = myTokenC.filters.Transfer(signer0.address);
      const logs = await myTokenC.queryFilter(filter, 0, "latest"); // 관련 로그를 array로 가져옴
    });

    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((MINTING_AMOUNT + 1n).toString(), DECIMALS),
          signer1.address,
        ),
      ).to.be.revertedWith("insufficient balance"); // overflowed
      // expect(await myTokenC.balanceOf(signer1)).equal( // state 변경없이 읽기만 하는 function
      //   hre.ethers.parseUnits("0.5", 18),
      // );
    });
  });
  describe("TransferFrom", () => {
    it("should emit Approval event", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.approve(
          signer1.address,
          hre.ethers.parseUnits("10", DECIMALS),
        ),
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", DECIMALS));
    });

    it("should transfer 3MT from signer0 to signer1", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];

      await myTokenC.approve(
        signer1.address,
        hre.ethers.parseUnits("3", DECIMALS),
      );

      await myTokenC
        .connect(signer1)
        .transferFrom(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("3", DECIMALS),
        );

      expect(await myTokenC.balanceOf(signer1.address)).to.equal(
        hre.ethers.parseUnits("3", DECIMALS),
      );
    });

    it("should be reverted with insufficient allowance error", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      await expect(
        myTokenC
          .connect(signer1)
          .transferFrom(
            signer0.address,
            signer1.address,
            hre.ethers.parseUnits("1", DECIMALS),
          ),
      ).to.have.revertedWith("insufficient allowance");
    });
  });
});
