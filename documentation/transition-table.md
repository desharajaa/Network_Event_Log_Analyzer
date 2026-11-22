# State Transition Table

## Academic Project: Network Event Log Analyzer

### Deterministic Finite Automaton (DFA) Transition Matrix

This table defines the deterministic behavior of the intrusion detection finite state machine.

| Current State ($q$) | Input Symbol ($\sigma$) | Next State ($\delta(q, \sigma)$) | Action Performed | Alert Triggered | Detailed Description |
| :---: | :---: | :---: | :--- | :---: | :--- |
| **S0** | **F** | **S1** | `RECORD_FIRST_FAILURE` | No | First failed connection attempt recorded for IP address. |
| **S0** | **S** | **S0** | `MAINTAIN_NORMAL` | No | Normal connection authenticated; state remains at S0. |
| **S1** | **F** | **S2** | `RECORD_SECOND_FAILURE` | No | Second consecutive failure; suspicious activity threshold imminent. |
| **S1** | **S** | **S0** | `RESET_TO_NORMAL` | No | Successful authentication; consecutive failure counter reset to 0. |
| **S2** | **F** | **S3** | `TRIGGER_SECURITY_ALERT` | **YES (HIGH)** | **3 consecutive failed attempts detected!** Raises high severity alert in database. |
| **S2** | **S** | **S0** | `RESET_TO_NORMAL` | No | Successful login resets sequence before alert threshold. |
| **S3** | **F** | **S3** | `MAINTAIN_ALERT_STATE` | No | Repeated failures while in alert state continue tracking without spamming duplicate alerts. |
| **S3** | **S** | **S0** | `RESET_ALERT_STATE` | No | Legitimate connection clears the alert state back to S0. |

---

### Delta Function $\delta(q, \sigma)$ Matrix Representation

$$\begin{array}{c|cc}
\delta & \mathbf{F} \text{ (Failed)} & \mathbf{S} \text{ (Success)} \\
\hline
\mathbf{S0} & S1 & S0 \\
\mathbf{S1} & S2 & S0 \\
\mathbf{S2} & S3 & S0 \\
\mathbf{S3} & S3 & S0 \\
\end{array}$$

### Per-IP State Tracking Invariant
- For any distinct IP address $IP_i$ and $IP_j$ ($i \neq j$):
  $$\delta(q_{IP_i}, \sigma) \text{ does not modify } q_{IP_j}$$
- Log events are evaluated in strict chronological order ($t_1 \le t_2 \le \dots \le t_n$).
