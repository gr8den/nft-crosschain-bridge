source .env

SOURCE_NETWORK=localhost
TARGET_NETWORK=localhost
SOURCE_CHAIN_ID=1337
TARGET_CHAIN_ID=1337


yarn hardhat deploy-nft --network $SOURCE_NETWORK
yarn hardhat deploy-nft --network $TARGET_NETWORK
NFT_ADDRESS=0xc975601cC2b320d91b58C0E29fb4D942a3625a2f

yarn hardhat deploy-bridge --nft $NFT_ADDRESS --network $SOURCE_NETWORK
yarn hardhat deploy-bridge --nft $NFT_ADDRESS --network $TARGET_NETWORK
BRIDGE_ADDRESS=0x09605925Fd27C58c764FafE8B316A369c13fD5d1

yarn hardhat mint --contract $NFT_ADDRESS --recipient $OWNER_ADDRESS --count 1 --network $SOURCE_NETWORK
yarn hardhat mint --contract $NFT_ADDRESS --recipient $BRIDGE_ADDRESS --count 1 --network $TARGET_NETWORK
TOKEN_ID=0x01

yarn hardhat init-swap --nft $NFT_ADDRESS --token-id $TOKEN_ID --bridge $BRIDGE_ADDRESS --chain-to $TARGET_CHAIN_ID --network $SOURCE_NETWORK
NONCE=0x0de9290262edcb

yarn hardhat validate --sender $OWNER_ADDRESS --chain-from $SOURCE_CHAIN_ID --chain-to $TARGET_CHAIN_ID --nonce $NONCE --token-id $TOKEN_ID --network $SOURCE_NETWORK
SIGN=0x75d80b1d00fc0f15c1f41b48485071a45c5822ab58fe611b1949b8723aa5df70346579f548459a667d0486db9f53c209d3d0a07a4c9366cfd6b7c12e1683975d1c
# SIGN=$(echo "$TMP_OUT" | grep "Signature: " | sed -e "s/Signature: //g")

yarn hardhat redeem-swap --bridge $BRIDGE_ADDRESS --chain-from $SOURCE_CHAIN_ID --chain-to $TARGET_CHAIN_ID --nonce $NONCE --token-id $TOKEN_ID --sign $SIGN --network $TARGET_NETWORK
