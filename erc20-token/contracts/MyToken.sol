// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title MyToken
/// @notice Minimal, dependency-free ERC-20 implementation with owner-only minting and public burning.
contract MyToken {
    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------
    error NotOwner();
    error ZeroAddress();
    error InsufficientBalance(uint256 available, uint256 required);
    error InsufficientAllowance(uint256 available, uint256 required);

    // ---------------------------------------------------------------------
    // Events (ERC-20 standard + ownership)
    // ---------------------------------------------------------------------
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    address public owner;
    uint256 public totalSupply;

    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    // ---------------------------------------------------------------------
    // Modifiers
    // ---------------------------------------------------------------------
    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------
    /// @param _name Token name, e.g. "MyToken"
    /// @param _symbol Token symbol, e.g. "MTK"
    /// @param initialSupply Initial supply in whole tokens (decimals are applied automatically)
    constructor(string memory _name, string memory _symbol, uint256 initialSupply) {
        name = _name;
        symbol = _symbol;
        owner = msg.sender;
        emit OwnershipTransferred(address(0), msg.sender);

        if (initialSupply > 0) {
            _mint(msg.sender, initialSupply * 10 ** decimals);
        }
    }

    // ---------------------------------------------------------------------
    // ERC-20 core
    // ---------------------------------------------------------------------
    function transfer(address to, uint256 value) external returns (bool) {
        _transfer(msg.sender, to, value);
        return true;
    }

    function approve(address spender, uint256 value) external returns (bool) {
        if (spender == address(0)) revert ZeroAddress();
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }

    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        uint256 allowed = allowance[from][msg.sender];
        if (allowed != type(uint256).max) {
            if (allowed < value) revert InsufficientAllowance(allowed, value);
            unchecked {
                allowance[from][msg.sender] = allowed - value;
            }
            emit Approval(from, msg.sender, allowance[from][msg.sender]);
        }
        _transfer(from, to, value);
        return true;
    }

    // ---------------------------------------------------------------------
    // Mint / burn / ownership
    // ---------------------------------------------------------------------
    /// @notice Mint `amount` base units to the caller (owner only).
    function mint(uint256 amount) external onlyOwner {
        _mint(msg.sender, amount);
    }

    /// @notice Mint `amount` base units to `to` (owner only).
    function mintTo(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    /// @notice Burn `amount` base units from the caller.
    function burn(uint256 amount) external {
        uint256 bal = balanceOf[msg.sender];
        if (bal < amount) revert InsufficientBalance(bal, amount);
        unchecked {
            balanceOf[msg.sender] = bal - amount;
            totalSupply -= amount;
        }
        emit Transfer(msg.sender, address(0), amount);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------
    function _transfer(address from, address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();
        uint256 bal = balanceOf[from];
        if (bal < value) revert InsufficientBalance(bal, value);
        unchecked {
            balanceOf[from] = bal - value;
            balanceOf[to] += value;
        }
        emit Transfer(from, to, value);
    }

    function _mint(address to, uint256 value) internal {
        if (to == address(0)) revert ZeroAddress();
        totalSupply += value;
        unchecked {
            balanceOf[to] += value;
        }
        emit Transfer(address(0), to, value);
    }
}
