source .env

# initial deposits for 100 gwei: minter - 0.5, bridge deployer - 0.2, nft owner - 0.1
# change gas price in `hardhat.config.ts` based on current network conditions

# SOURCE_NETWORK=tbnb
# TARGET_NETWORK=tmatic
# SOURCE_CHAIN_ID=97
# TARGET_CHAIN_ID=80001

SOURCE_NETWORK=bnb
TARGET_NETWORK=matic
SOURCE_CHAIN_ID=56
TARGET_CHAIN_ID=137

yarn hardhat deploy-nft --network $SOURCE_NETWORK
yarn hardhat deploy-nft --network $TARGET_NETWORK
NFT_ADDRESS=0xe6a9605Fefd788be2c7E19579487bE268E6f046e

yarn hardhat deploy-bridge --nft $NFT_ADDRESS --network $SOURCE_NETWORK
yarn hardhat deploy-bridge --nft $NFT_ADDRESS --network $TARGET_NETWORK
BRIDGE_ADDRESS=0xCF42802220826C85bF23897bc7D48fCe8d7baE74

yarn hardhat mint --contract $NFT_ADDRESS --recipient $OWNER_ADDRESS --count 10 --network $SOURCE_NETWORK
yarn hardhat mint --contract $NFT_ADDRESS --recipient $BRIDGE_ADDRESS --count 10 --network $TARGET_NETWORK
TOKEN_ID=0x01

# Source -> Target

yarn hardhat init-swap --nft $NFT_ADDRESS --token-id $TOKEN_ID --bridge $BRIDGE_ADDRESS --chain-to $TARGET_CHAIN_ID --network $SOURCE_NETWORK
NONCE=0x03b8de8ef0ebf202

yarn hardhat validate --sender $OWNER_ADDRESS --chain-from $SOURCE_CHAIN_ID --chain-to $TARGET_CHAIN_ID --nonce $NONCE --token-id $TOKEN_ID --network $SOURCE_NETWORK
SIGN=0x5aee784ca2b9b1a0abbb40405c53813585fecc7bda2750f5089bd0a79b7829c8018e9d47ab45a537de1e43114b4a2e1a1d42950874645c8b9186c40b997c4cdd1c

yarn hardhat redeem-swap --bridge $BRIDGE_ADDRESS --chain-from $SOURCE_CHAIN_ID --chain-to $TARGET_CHAIN_ID --nonce $NONCE --token-id $TOKEN_ID --sign $SIGN --network $TARGET_NETWORK

yarn hardhat nft-owner --contract $NFT_ADDRESS --token-id $TOKEN_ID --network $SOURCE_NETWORK
yarn hardhat nft-owner --contract $NFT_ADDRESS --token-id $TOKEN_ID --network $TARGET_NETWORK


# Swap back: Target -> Source

yarn hardhat init-swap --nft $NFT_ADDRESS --token-id $TOKEN_ID --bridge $BRIDGE_ADDRESS --chain-to $SOURCE_CHAIN_ID --network $TARGET_NETWORK
NONCE=0x014baa75548d5fa2

yarn hardhat validate --sender $OWNER_ADDRESS --chain-from $TARGET_CHAIN_ID --chain-to $SOURCE_CHAIN_ID --nonce $NONCE --token-id $TOKEN_ID --network $TARGET_NETWORK
SIGN=0x6d47253857de584c6e60fefd0e84ac43e6846e63e217c2ff7f5a5678eb43137401e85e95105ef1f93195d6a377ed243ba60db1b8fc00bc26bb91e60b5f0338991b

yarn hardhat redeem-swap --bridge $BRIDGE_ADDRESS --chain-from $TARGET_CHAIN_ID --chain-to $SOURCE_CHAIN_ID --nonce $NONCE --token-id $TOKEN_ID --sign $SIGN --network $SOURCE_NETWORK
