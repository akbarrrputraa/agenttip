// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title AgentTip — tip any Agent ID by its .ai name, plus free daily check-ins
/// @notice Agent ID is used as identity + payments. No token, no fees, no paid
///         features, no owner powers over user funds. There is no owner at all:
///         no pause, no mint, no tax, no upgradeability, no withdraw function.
///         Plain BNB sent to this contract reverts (no receive/fallback), so
///         funds can never get stuck here. Tips forward 100% of msg.value.
/// @dev Agent ID names are lowercase as claimed on SPACE ID. The token ID of a
///      name is keccak256(name) WITHOUT the ".ai" suffix, e.g.
///      keccak256("0xakbarrr") = 0xc06fa04e24f3172097e5e033c10428f9686c5391b194ed0497f3ed1c6acf585b.
///      The frontend lowercases and strips a trailing ".ai" before calling.
interface IAgentId {
    function ownerOf(uint256 tokenId) external view returns (address);
    function balanceOf(address owner) external view returns (uint256);
}

contract AgentTip {
    IAgentId public constant AGENT_ID =
        IAgentId(0x60B9262456dE011F7d15a54CdD8c48bAaa8B022F);

    uint256 public totalTipped;
    uint256 public totalTips;
    uint256 public totalCheckIns;

    /// @notice tokenId => UTC day number (block.timestamp / 86400) of last check-in
    mapping(uint256 => uint256) public lastCheckInOf;
    /// @notice tokenId => current consecutive-day streak
    mapping(uint256 => uint256) public streakOf;

    event Tipped(
        address indexed from,
        uint256 indexed agentId,
        address indexed to,
        uint256 amount,
        string name
    );
    event CheckedIn(
        uint256 indexed agentId,
        address indexed wallet,
        uint256 day,
        uint256 streak
    );

    /// @notice Token ID for an Agent ID name (no ".ai" suffix).
    function agentIdOf(string calldata name) public pure returns (uint256) {
        return uint256(keccak256(bytes(name)));
    }

    /// @notice Resolve a name to its owner's address. Returns address(0) if
    ///         the name is not registered (registry ownerOf reverts then).
    function resolveName(string calldata name) public view returns (address) {
        uint256 id = agentIdOf(name);
        try AGENT_ID.ownerOf(id) returns (address owner) {
            return owner;
        } catch {
            return address(0);
        }
    }

    /// @notice Tip an Agent ID by name. Forwards 100% of msg.value to the
    ///         resolved owner. No fee is taken by this contract or anyone.
    function tipByName(string calldata name) external payable {
        require(msg.value > 0, "AgentTip: zero tip");
        uint256 id = agentIdOf(name);
        address to = resolveName(name);
        require(to != address(0), "AgentTip: name not registered");
        totalTipped += msg.value;
        totalTips += 1;
        emit Tipped(msg.sender, id, to, msg.value, name);
        (bool ok, ) = to.call{value: msg.value}("");
        require(ok, "AgentTip: transfer failed");
    }

    /// @notice Free daily check-in for Agent ID holders. Caller passes their
    ///         own Agent ID tokenId; ownership is verified on-chain.
    ///         One check-in per Agent ID per UTC day. Consecutive days build
    ///         the streak; a missed day resets it to 1.
    function checkIn(uint256 agentId) external {
        require(
            AGENT_ID.ownerOf(agentId) == msg.sender,
            "AgentTip: not Agent ID owner"
        );
        uint256 day = block.timestamp / 86400;
        uint256 last = lastCheckInOf[agentId];
        require(day > last, "AgentTip: already checked in today");
        uint256 streak = (last == day - 1) ? streakOf[agentId] + 1 : 1;
        lastCheckInOf[agentId] = day;
        streakOf[agentId] = streak;
        totalCheckIns += 1;
        emit CheckedIn(agentId, msg.sender, day, streak);
    }
}
