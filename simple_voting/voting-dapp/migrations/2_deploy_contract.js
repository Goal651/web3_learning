const Voting = artifacts.require("Voting");

module.exports = async function (deployer, network, accounts) {
  const adminAddress = accounts[0]; 
  await deployer.deploy(Voting, adminAddress);
};
