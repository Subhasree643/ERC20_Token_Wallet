// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/// @title DecodeLabs Token (ERC-20, implemented from scratch)
/// @notice Standard ERC-20 with secure transfer logic and balance validation.
/// @dev Solidity >=0.8 has built-in overflow/underflow checks; explicit balance
///      validation is still done so the revert reason is clear ("Insufficient balance").
contract DecodeLabsToken {
    // ---------- Metadata ----------
    string public name;
    string public symbol;
    uint8 public constant decimals = 18;

    // ---------- State ----------
    uint256 public totalSupply;
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;

    // ---------- Events (required by the ERC-20 standard) ----------
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    /// @param initialSupply whole tokens (will be scaled by 10**decimals) minted to the deployer
    constructor(string memory name_, string memory symbol_, uint256 initialSupply) {
        name = name_;
        symbol = symbol_;
        uint256 supply = initialSupply * (10 ** uint256(decimals));
        totalSupply = supply;
        _balances[msg.sender] = supply;
        emit Transfer(address(0), msg.sender, supply);
    }

    // ---------- Read ----------
    /// @notice Gasless state read: exact raw balance (in smallest units) of `account`.
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }

    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }

    // ---------- Write ----------
    /// @notice Move `amount` raw units from the caller to `to`.
    function transfer(address to, uint256 amount) external returns (bool) {
        _transfer(msg.sender, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        require(spender != address(0), "Invalid spender");
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        uint256 allowed = _allowances[from][msg.sender];
        if (allowed != type(uint256).max) {
            require(allowed >= amount, "Insufficient allowance");
            unchecked {
                _allowances[from][msg.sender] = allowed - amount;
            }
        }
        _transfer(from, to, amount);
        return true;
    }

    // ---------- Internal ----------
    function _transfer(address from, address to, uint256 amount) internal {
        // 1. Checks
        require(to != address(0), "Invalid recipient");
        uint256 fromBalance = _balances[from];
        require(fromBalance >= amount, "Insufficient balance");

        // 2. Effects (zero-value transfers are valid and still emit the event, per the standard)
        unchecked {
            _balances[from] = fromBalance - amount; // cannot underflow: checked above
        }
        _balances[to] += amount;

        emit Transfer(from, to, amount);
    }
}
