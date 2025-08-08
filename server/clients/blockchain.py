import os
from typing import Optional, Dict, Any
from web3 import Web3
from dotenv import load_dotenv

load_dotenv()


class BlockchainClient:
    """Client for interacting with the FirstSignal smart contract on Base Sepolia."""
    
    # Base Sepolia RPC URL
    BASE_SEPOLIA_RPC = "https://sepolia.base.org"
    
    # Smart contract ABI for FirstSignal
    CONTRACT_ABI = [
        {
            "inputs": [],
            "name": "retrieve",
            "outputs": [
                {
                    "internalType": "string[]",
                    "name": "",
                    "type": "string[]"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "retrieveLast",
            "outputs": [
                {
                    "internalType": "string",
                    "name": "",
                    "type": "string"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "string",
                    "name": "_message",
                    "type": "string"
                }
            ],
            "name": "store",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ]
    
    def __init__(self):
        """Initialize the blockchain client."""
        # Load environment variables
        self.private_key = os.getenv("PRIVATE_KEY")
        self.contract_address = "0x1833a8161695AE9A6315C814cf8687c0E972E754"
        
        if not self.private_key:
            raise ValueError("BLOCKCHAIN_PRIVATE_KEY must be set in environment")
        if not self.contract_address:
            raise ValueError("SMART_CONTRACT_ADDRESS must be set in environment")
        
        # Initialize Web3 connection
        self.w3 = Web3(Web3.HTTPProvider(self.BASE_SEPOLIA_RPC))
        
        # Verify connection
        if not self.w3.is_connected():
            raise RuntimeError("Failed to connect to Base Sepolia network")
        
        # Get account from private key
        self.account = self.w3.eth.account.from_key(self.private_key)
        
        # Initialize contract
        self.contract = self.w3.eth.contract(
            address=Web3.to_checksum_address(self.contract_address),
            abi=self.CONTRACT_ABI
        )
        
        print(f"Blockchain client initialized for account: {self.account.address}")
    
    def store_message(self, message: str) -> Dict[str, Any]:
        """
        Store a message on the blockchain by calling the smart contract's store function.
        
        Args:
            message: The message to store on the blockchain
            
        Returns:
            Dictionary containing transaction details
            
        Raises:
            Exception: If the transaction fails
        """
        try:
            # Build transaction
            transaction = self.contract.functions.store(message).build_transaction({
                'from': self.account.address,
                'gas': 100000,  # Estimate gas limit
                'gasPrice': self.w3.to_wei('20', 'gwei'),  # Set gas price
                'nonce': self.w3.eth.get_transaction_count(self.account.address),
            })
            
            # Sign transaction
            signed_txn = self.w3.eth.account.sign_transaction(transaction, self.private_key)
            
            # Send transaction
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.raw_transaction)
            
            print(f"Transaction sent: {tx_hash.hex()}")
            
            # Wait for transaction receipt
            tx_receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            return {
                "success": True,
                "transaction_hash": tx_receipt.transactionHash.hex(),
                "block_number": tx_receipt.blockNumber,
                "gas_used": tx_receipt.gasUsed,
                "message": message
            }
            
        except Exception as e:
            print(f"Blockchain transaction failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": message
            }
    
    def retrieve_last_message(self) -> Optional[str]:
        """
        Retrieve the last stored message from the smart contract.
        
        Returns:
            The last stored message or None if retrieval fails
        """
        try:
            result = self.contract.functions.retrieveLast().call()
            return result
        except Exception as e:
            print(f"Failed to retrieve last message: {e}")
            return None
    
    def retrieve_all_messages(self) -> Optional[list]:
        """
        Retrieve all stored messages from the smart contract.
        
        Returns:
            List of all stored messages or None if retrieval fails
        """
        try:
            result = self.contract.functions.retrieve().call()
            return result
        except Exception as e:
            print(f"Failed to retrieve all messages: {e}")
            return None


# Global instance
_blockchain_client: Optional[BlockchainClient] = None


def get_blockchain_client() -> BlockchainClient:
    """Get or create the global blockchain client instance."""
    global _blockchain_client
    if _blockchain_client is None:
        _blockchain_client = BlockchainClient()
    return _blockchain_client 