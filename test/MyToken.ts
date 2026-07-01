import hre from "hardhat";
import { expect } from "chai";
import { MyToken } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const mintingAmount = 100n;
const decimals = 18n;

describe("My Token", () => {
  let myTokenC: MyToken;
  let signers: HardhatEthersSigner[];
  beforeEach("should deploy", async () => {
    signers = await hre.ethers.getSigners();
    myTokenC = await hre.ethers.deployContract("MyToken", [
      // 배포시 state 변경
      "MyToken",
      "MT",
      decimals,
      mintingAmount,
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
      expect(await myTokenC.decimals()).equal(decimals);
    });
    it("should return 100 totalSupply", async () => {
      expect(await myTokenC.totalSupply()).equal(
        mintingAmount * 10n ** decimals,
      );
    });
  });

  // 1MT = 1*10^18

  describe("Mint", () => {
    it("should return 1MT balance for signer 0", async () => {
      const signer0 = signers[0];
      expect(await myTokenC.balanceOf(signer0)).equal(
        mintingAmount * 10n ** decimals,
      );
    });
  });

  describe("Transfer", () => {
    it("should have 0.5MT", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];
      // const tx =
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits("0.5", decimals),
          signer1.address,
        ),
      )
        .to.emit(myTokenC, "Transfer")
        .withArgs(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("0.5", decimals),
        ); // 호출 시, transaction 생성

      /*
      const receipt = await tx.wait(); // transaction이 완료될 때까지 기다림
      console.log(receipt?.logs);
      */
      expect(await myTokenC.balanceOf(signer1.address)).equal(
        // state 변경없이 읽기만 하는 function
        hre.ethers.parseUnits("0.5", decimals),
      );

      const filter = myTokenC.filters.Transfer(signer0.address);
      const logs = await myTokenC.queryFilter(filter, 0, "latest"); // 관련 로그를 array로 가져옴

      /*
      console.log(logs.length);

      console.log(logs[0].args.from); // 실제 발생한 event의 데이터 참고 가능
      console.log(logs[0].args.to);
      console.log(logs[0].args.value);
      */
    });

    it("should be reverted with insufficient balance error", async () => {
      const signer1 = signers[1];
      await expect(
        myTokenC.transfer(
          hre.ethers.parseUnits((mintingAmount + 1n).toString(), decimals),
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
          hre.ethers.parseUnits("10", decimals),
        ),
      )
        .to.emit(myTokenC, "Approval")
        .withArgs(signer1.address, hre.ethers.parseUnits("10", decimals));
    });

    it("should transfer 3MT from signer0 to signer1", async () => {
      const signer0 = signers[0];
      const signer1 = signers[1];

      await myTokenC.approve(
        signer1.address,
        hre.ethers.parseUnits("3", decimals),
      );

      await myTokenC
        .connect(signer1)
        .transferFrom(
          signer0.address,
          signer1.address,
          hre.ethers.parseUnits("3", decimals),
        );

      // balance 확인
      expect(await myTokenC.balanceOf(signer1.address)).to.equal(
        hre.ethers.parseUnits("3", decimals),
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
            hre.ethers.parseUnits("1", decimals),
          ),
      ).to.have.revertedWith("insufficient allowance");
    });
  });
});
