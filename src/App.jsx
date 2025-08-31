import React, { useEffect, useMemo, useState } from "react";

export default function App() {
  // ---------------- NAV ----------------
  const [activeTab, setActiveTab] = useState("home"); // "home" | "leaderboard" | "profile" | "wallet"
  const [showNotifs, setShowNotifs] = useState(false);

  // ---------------- PROFILE ----------------
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [auth, setAuth] = useState({ username: "", password: "" });

  // per-user localStorage key helper
  const userKey = (suffix) =>
    user && user.username
      ? "bc_" + user.username + "_" + suffix
      : "bc_guest_" + suffix;

  // ---------------- NOTIFICATIONS ----------------
  const [notifs, setNotifs] = useState([]);

  function loadNotifs() {
    try {
      const arr = JSON.parse(localStorage.getItem(userKey("notifs")) || "[]");
      setNotifs(arr);
    } catch {
      setNotifs([]);
    }
  }
  useEffect(loadNotifs, [user]);

  function notify(text) {
    const item = { id: Date.now(), text, ts: new Date().toISOString() };
    const key = userKey("notifs");
    const prev = JSON.parse(localStorage.getItem(key) || "[]");
    const next = [item, ...prev].slice(0, 100);
    localStorage.setItem(key, JSON.stringify(next));
    setNotifs(next);
  }

  // ---------------- AUTH ----------------
  function handleLogin() {
    const saved = localStorage.getItem("user");
    if (!saved) return alert("No user found. Please sign up first.");
    try {
      const u = JSON.parse(saved);
      if (u.username === auth.username.trim() && u.password === auth.password) {
        setUser(u);
        notify("Logged in successfully");
        alert("Login successful!");
      } else {
        alert("Invalid username or password.");
      }
    } catch {
      alert("Corrupted user data.");
    }
  }

  // SIGNUP: Direct account creation without OTP
  function handleSignup() {
    const name = auth.username.trim();
    const pass = auth.password;
    if (!name || !pass) return alert("Please fill all fields.");

    const u = { username: name, password: pass };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    setAuth({ username: "", password: "" });
    notify("Signup successful — welcome!");
    alert("Signup successful! You are logged in.");
  }

  function handleEditProfile() {
    const newUsername = prompt("New username (email or mobile):", user ? user.username : "");
    const newPassword = prompt("New password:", user ? user.password : "");
    if (!newUsername || !newPassword) return;
    const u = { username: newUsername.trim(), password: newPassword };
    localStorage.setItem("user", JSON.stringify(u));
    setUser(u);
    notify("Profile updated");
    alert("Profile updated!");
  }

  function handleLogout() {
    notify("Logged out");
    setUser(null);
    alert("Logged out!");
  }

  // ---------------- CRYPTO (Binance live) ----------------
  const CRYPTO_SYMBOLS = useMemo(
    () => [
      "BTCUSDT","ETHUSDT","BNBUSDT","XRPUSDT","ADAUSDT","DOGEUSDT","SOLUSDT","TRXUSDT","MATICUSDT","DOTUSDT",
      "LTCUSDT","SHIBUSDT","AVAXUSDT","UNIUSDT","ATOMUSDT","LINKUSDT","XLMUSDT","ETCUSDT","TONUSDT","APTUSDT",
      "ICPUSDT","NEARUSDT","FILUSDT","HBARUSDT","QNTUSDT","VETUSDT","EGLDUSDT","SANDUSDT","AXSUSDT","AAVEUSDT",
      "MANAUSDT","XTZUSDT","THETAUSDT","RUNEUSDT","FLOWUSDT","GRTUSDT","KSMUSDT","ZILUSDT","ENJUSDT","CHZUSDT",
      "BATUSDT","FTMUSDT","NEOUSDT","CRVUSDT","1INCHUSDT","WAVESUSDT","COMPUSDT","GALAUSDT","KAVAUSDT","CELOUSDT",
    ],
    []
  );

  const [cryptoRows, setCryptoRows] = useState(
    CRYPTO_SYMBOLS.map((s) => ({ symbol: s, price: null, change: 0 }))
  );

  useEffect(() => {
    let cancelled = false;

    function load() {
      Promise.all(
        CRYPTO_SYMBOLS.map((sym) =>
          fetch("https://api.binance.com/api/v3/ticker/price?symbol=" + sym)
            .then((r) => r.json())
            .catch(() => null)
        )
      )
        .then((results) => {
          if (cancelled) return;
          setCryptoRows((prev) =>
            results.map((res, idx) => {
              const priceNum = res && res.price ? parseFloat(res.price) : prev[idx]?.price ?? null;
              const prevPrice = prev[idx]?.price ?? priceNum;
              let change = 0;
              if (priceNum != null && prevPrice != null && prevPrice !== 0) {
                change = ((priceNum - prevPrice) / prevPrice) * 100;
              }
              return { symbol: CRYPTO_SYMBOLS[idx], price: priceNum, change: change };
            })
          );
        })
        .catch(() => {});
    }

    load();
    const id = setInterval(load, 1500); // gentle polling
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [CRYPTO_SYMBOLS]);

  // ---------------- STOCKS (simulated ₹ live) ----------------
  const STOCK_NAMES = useMemo(
    () => [
      "Reliance","TCS","Infosys","HDFC Bank","ICICI Bank","SBI","Bharti Airtel","HUL","ITC","Kotak Bank",
      "Axis Bank","Bajaj Finance","HCL Tech","Wipro","Adani Green","Adani Ports","ONGC","NTPC","PowerGrid","Asian Paints",
      "Maruti Suzuki","Tata Motors","M&M","UltraTech","Larsen & Toubro","JSW Steel","Tata Steel","Hindalco","Grasim","Tech Mahindra",
      "Nestle India","Britannia","Divis Labs","Sun Pharma","Dr Reddy","Cipla","Eicher Motors","Hero MotoCorp","Coal India","BPCL",
      "IOC","IndusInd Bank","Zomato","Paytm","Nykaa","DMart","SBI Life","HDFC Life","ICICI Lombard","Siemens",
    ],
    []
  );

  const [stocks, setStocks] = useState(
    STOCK_NAMES.map((name) => ({
      name: name,
      price: +(100 + Math.random() * 2000).toFixed(2),
      change: 0,
    }))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setStocks((prev) =>
        prev.map((s) => {
          const drift = 1 + (Math.random() - 0.5) * 0.01;
          const newPrice = +(s.price * drift).toFixed(2);
          const change = +(((newPrice - s.price) / (s.price || 1)) * 100).toFixed(2);
          return { name: s.name, price: newPrice, change: change };
        })
      );
    }, 1500);
    return () => clearInterval(id);
  }, []);

  // ---------------- TEAM ----------------
  const [team, setTeam] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("team") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("team", JSON.stringify(team));
  }, [team]);

  function toggleTeam(id) {
    setTeam((prev) => {
      if (prev.includes(id)) {
        notify("Removed " + id + " from team");
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 11) {
        alert("You can select up to 11 only.");
        return prev;
      }
      notify("Selected " + id + " to team");
      return [...prev, id];
    });
  }

  function priceForId(id) {
    if (id.startsWith("C:")) {
      const sym = id.replace("C:", "") + "USDT";
      const row = cryptoRows.find((r) => r.symbol === sym);
      return row?.price ?? null;
    } else {
      const name = id.replace("S:", "");
      const row = stocks.find((r) => r.name === name);
      return row?.price ?? null;
    }
  }

  const teamValue = useMemo(() => {
    return team.reduce((sum, id) => {
      const p = priceForId(id);
      return sum + (p || 0);
    }, 0);
  }, [team, cryptoRows, stocks]);

  // ---------------- WALLET ----------------
  const [wallet, setWallet] = useState({ balance: 0, tx: [] });

  function loadWallet() {
    try {
      const w = JSON.parse(localStorage.getItem(userKey("wallet")) || '{"balance":0,"tx":[]}');
      setWallet(w);
    } catch {
      setWallet({ balance: 0, tx: [] });
    }
  }
  useEffect(loadWallet, [user]);

  useEffect(() => {
    localStorage.setItem(userKey("wallet"), JSON.stringify(wallet));
  }, [wallet, user]);

  function addMoney() {
    const amount = parseFloat(prompt("Enter amount to add (₹):", "1000") || "0");
    if (!amount || amount <= 0) return;
    const method = prompt("Payment method (UPI / Card):", "UPI") || "UPI";
    const entry = { id: Date.now(), type: "Add", amount: amount, method: method, ts: new Date().toISOString() };
    setWallet((w) => ({
      balance: +(w.balance + amount).toFixed(2),
      tx: [entry, ...w.tx].slice(0, 100),
    }));
    notify("Wallet +" + amount.toFixed(2) + " via " + method);
  }
  function withdrawMoney() {
    const amount = parseFloat(prompt("Enter amount to withdraw (₹):", "500") || "0");
    if (!amount || amount <= 0) return;
    if (amount > wallet.balance) return alert("Insufficient balance.");
    const method = prompt("Withdraw to (UPI / Card):", "UPI") || "UPI";
    const entry = { id: Date.now(), type: "Withdraw", amount: amount, method: method, ts: new Date().toISOString() };
    setWallet((w) => ({
      balance: +(w.balance - amount).toFixed(2),
      tx: [entry, ...w.tx].slice(0, 100),
    }));
    notify("Wallet -" + amount.toFixed(2) + " to " + method);
  }

  // ---------------- LEADERBOARD ----------------
  const [board, setBoard] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("leaderboard") || "[]");
      if (saved.length) return saved;
    } catch {}
    return [
      { id: 1, username: "Aarav", value: 25000 },
      { id: 2, username: "Vihaan", value: 22000 },
      { id: 3, username: "Diya", value: 20500 },
    ];
  });

  useEffect(() => {
    localStorage.setItem("leaderboard", JSON.stringify(board));
  }, [board]);

  // gentle movement for demo users
  useEffect(() => {
    const id = setInterval(() => {
      setBoard((prev) =>
        prev.map((u) =>
          u.username === (user?.username || "")
            ? u
            : { ...u, value: +(u.value * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2) }
        )
      );
    }, 3000);
    return () => clearInterval(id);
  }, [user]);

  function submitTeamToBoard() {
    if (!user) return alert("Login first to join leaderboard.");
    if (team.length !== 11) return alert("Select exactly 11 to create team.");
    const entry = { id: Date.now(), username: user.username, value: +teamValue.toFixed(2) };
    setBoard((prev) => {
      const filtered = prev.filter((x) => x.username !== user.username);
      const next = [...filtered, entry].sort((a, b) => b.value - a.value).slice(0, 100);
      return next;
    });
    notify("Team submitted to leaderboard (value " + teamValue.toFixed(2) + ")");
    alert("Team created and added to leaderboard!");
  }

  // ---------------- COLORS & STYLES ----------------
  const COLOR_CYCLE = ["#3b82f6","#10b981","#f59e0b","#ef4444","#8b5cf6","#ec4899","#14b8a6","#f97316","#0ea5e9","#22c55e"];
  const topBtnColors = { profile: "#3b82f6", wallet: "#10b981", bell: "#f59e0b" };
  const navBtnColors = { home: "#8b5cf6", leaderboard: "#ef4444", profile: "#14b8a6" };
  const cycleColor = (i) => COLOR_CYCLE[i % COLOR_CYCLE.length];

  const styles = {
    app: { fontFamily: "Arial, sans-serif", background: "#0a0a0a", color: "#fff", minHeight: "100vh" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111", color: "#fff", padding: "12px 20px" },
    btnTop: { marginRight: 12, color: "#fff", border: "none", padding: "8px 14px", borderRadius: 5, cursor: "pointer" },
    title: { margin: 0, fontSize: 22 },
    nav: { display: "flex", justifyContent: "center", background: "#222" },
    navBtn: (active, bg) => ({
      flex: 1, padding: 12, border: "none", background: bg, color: "#fff", cursor: "pointer", fontSize: 16,
      boxShadow: active ? "0 0 0 2px rgba(255,255,255,0.25) inset" : "none",
    }),
    container: { padding: 20 },
    rowWrap: { display: "flex", gap: 20, alignItems: "stretch" },
    card: { background: "#1e1e1e", padding: 12, borderRadius: 10, boxShadow: "0 0 12px rgba(255,215,0,0.25)", flex: 1, display: "flex", flexDirection: "column" },
    listBox: { maxHeight: 440, overflowY: "auto", paddingRight: 6 },
    row: (idx) => ({
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "10px 12px", borderRadius: 8, background: idx % 2 === 0 ? "#2a2a2a" : "#333", marginBottom: 6,
    }),
    smallBtnBase: { marginLeft: 8, padding: "4px 8px", borderRadius: 4, border: "none", cursor: "pointer", color: "#fff", fontWeight: 600 },
    primary: { width: "100%", padding: 10, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", background: "#22c55e" },
    secondary: { width: "100%", padding: 10, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 10, background: "#0ea5e9" },
    danger: { width: "100%", padding: 10, color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 10, background: "#9333ea" },
    badge: { padding: "2px 6px", borderRadius: 6, background: "#444", marginLeft: 8, fontSize: 12 },
    notifPanel: { position: "fixed", right: 16, top: 64, width: 320, maxHeight: 420, overflowY: "auto", background:"#1f1f1f", borderRadius: 10, boxShadow:"0 8px 20px rgba(0,0,0,0.5)", padding: 12, zIndex: 10 }
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <button
            style={{ ...styles.btnTop, background: topBtnColors.profile }}
            onClick={() => setActiveTab("profile")}
          >
            Profile
          </button>
        </div>
        <h1 style={styles.title}>BitbullCoin Fantasy Crypto</h1>
        <div>
          <button
            style={{ ...styles.btnTop, background: topBtnColors.wallet }}
            onClick={() => setActiveTab("wallet")}
          >
            Wallet
          </button>
          <button
            style={{ ...styles.btnTop, background: topBtnColors.bell, position: "relative" }}
            onClick={() => setShowNotifs((v) => !v)}
            title="Notifications"
          >
            🔔
            <span style={{ ...styles.badge, background: "#222", position: "absolute", top: -6, right: -6 }}>
              {notifs.length}
            </span>
          </button>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifs && (
        <div style={styles.notifPanel}>
          <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
            <h3 style={{margin:0}}>Notifications</h3>
            <button
              style={{ ...styles.smallBtnBase, background:"#ef4444"}}
              onClick={() => { localStorage.setItem(userKey("notifs"), "[]"); setNotifs([]); }}
            >
              Clear
            </button>
          </div>
          <div style={{ marginTop: 8 }}>
            {notifs.length === 0 ? <div>No notifications yet.</div> : notifs.map((n, i) => (
              <div key={n.id} style={styles.row(i)}>
                <div style={{fontSize:14}}>{n.text}</div>
                <div style={{fontSize:11, opacity:0.7}}>{new Date(n.ts).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nav */}
      <nav style={styles.nav}>
        <button
          style={styles.navBtn(activeTab === "home", navBtnColors.home)}
          onClick={() => setActiveTab("home")}
        >
          Home
        </button>
        <button
          style={styles.navBtn(activeTab === "leaderboard", navBtnColors.leaderboard)}
          onClick={() => setActiveTab("leaderboard")}
        >
          Leaderboard
        </button>
        <button
          style={styles.navBtn(activeTab === "profile", navBtnColors.profile)}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </button>
      </nav>

      {/* Content */}
      <div style={styles.container}>
        {/* HOME */}
        {activeTab === "home" && (
          <div>
            <div style={styles.rowWrap}>
              {/* Cryptos (left) */}
              <div style={styles.card}>
                <h2 style={{ color: "#00FFFF", textAlign: "center", marginBottom: 8 }}>Top 50 Cryptos</h2>
                <div style={styles.listBox}>
                  {cryptoRows.map((c, idx) => {
                    const name = c.symbol.replace("USDT", "");
                    const id = "C:" + name;
                    const color = (c.change ?? 0) >= 0 ? "#00FF00" : "#FF4500";
                    return (
                      <div key={c.symbol} style={styles.row(idx)}>
                        <span>{idx + 1}. {name}</span>
                        <span style={{ color }}>
                          {c.price == null ? "…" : "$" + c.price.toFixed(2)}
                          <button
                            style={{ ...styles.smallBtnBase, background: cycleColor(idx) }}
                            onClick={() => toggleTeam(id)}
                          >
                            {team.includes(id) ? "Remove" : "Select"}
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Stocks (right) */}
              <div style={styles.card}>
                <h2 style={{ color: "#FF69B4", textAlign: "center", marginBottom: 8 }}>Top 50 Indian Stocks</h2>
                <div style={styles.listBox}>
                  {stocks.map((s, idx) => {
                    const id = "S:" + s.name;
                    const color = (s.change ?? 0) >= 0 ? "#00FF00" : "#FF4500";
                    return (
                      <div key={s.name} style={styles.row(idx)}>
                        <span>{idx + 1}. {s.name}</span>
                        <span style={{ color }}>
                          {"₹" + s.price.toFixed(2)}{" "}
                          {"(" + ((s.change >= 0 ? "+" : "") + s.change.toFixed(2)) + "%)"}
                          <button
                            style={{ ...styles.smallBtnBase, background: cycleColor(idx + 3) }}
                            onClick={() => toggleTeam(id)}
                          >
                            {team.includes(id) ? "Remove" : "Select"}
                          </button>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <h3 style={{ marginTop: 20 }}>My Team ({team.length}/11)</h3>
            <div style={styles.card}>
              {team.length === 0 ? (
                <div>No selections yet.</div>
              ) : (
                <>
                  <div style={{display:"flex", justifyContent:"space-between", marginBottom:10}}>
                    <div>Total Team Value: <strong>$ / ₹ {teamValue.toFixed(2)}</strong></div>
                    {team.length === 11 && (
                      <button
                        style={{ ...styles.smallBtnBase, background: "#22c55e" }}
                        onClick={submitTeamToBoard}
                      >
                        Create Team
                      </button>
                    )}
                  </div>
                  <div style={styles.listBox}>
                    {team.map((t, i) => {
                      const price = priceForId(t);
                      return (
                        <div key={t} style={styles.row(i)}>
                          <span>{t}</span>
                          <span>{price == null ? "…" : (t.startsWith("C:") ? "$" : "₹") + price.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* LEADERBOARD */}
        {activeTab === "leaderboard" && (
          <div style={styles.card}>
            <h2>Leaderboard</h2>
            <div style={styles.listBox}>
              {[...board].sort((a,b)=>b.value-a.value).map((u, idx) => (
                <div key={u.id} style={styles.row(idx)}>
                  <span>{idx+1}. {u.username}</span>
                  <span>$ / ₹ {(+u.value).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <button
              style={styles.secondary}
              onClick={() => {
                if (!user) return alert("Login first.");
                const updated = { id: Date.now(), username: user.username, value: +teamValue.toFixed(2) };
                setBoard((prev) => {
                  const filtered = prev.filter((x) => x.username !== user.username);
                  return [...filtered, updated].sort((a,b)=>b.value-a.value).slice(0,100);
                });
                notify("Leaderboard updated with your current team value");
                alert("Leaderboard updated with your current team value.");
              }}
            >
              Update My Rank with Current Team Value
            </button>
          </div>
        )}

        {/* WALLET */}
        {activeTab === "wallet" && (
          <div style={{ maxWidth: 520, margin: "0 auto" }}>
            <div style={styles.card}>
              <h3>Wallet</h3>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                <div>Balance: <strong>₹ {wallet.balance.toFixed(2)}</strong></div>
                <div>
                  <button style={{ ...styles.smallBtnBase, background:"#22c55e" }} onClick={addMoney}>Add Money</button>
                  <button style={{ ...styles.smallBtnBase, background:"#ef4444", marginLeft:10 }} onClick={withdrawMoney}>Withdraw</button>
                </div>
              </div>
              <h4 style={{marginTop:16}}>Transactions</h4>
              <div style={styles.listBox}>
                {wallet.tx.length === 0 ? (
                  <div>No transactions yet.</div>
                ) : wallet.tx.map((t, i) => (
                  <div key={t.id} style={styles.row(i)}>
                    <span>{t.type} via {t.method}</span>
                    <span>{t.type === "Add" ? "+" : "-"}₹{t.amount.toFixed(2)} <span style={{opacity:0.6, marginLeft:8}}>{new Date(t.ts).toLocaleString()}</span></span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {activeTab === "profile" && (
          <div style={{ maxWidth: 420, margin: "0 auto" }}>
            {!user ? (
              <div style={styles.card}>
                <h3>Login / Signup</h3>
                <input
                  placeholder="Email or Mobile (for login/signup)"
                  value={auth.username}
                  onChange={(e) => setAuth({ username: e.target.value, password: auth.password })}
                  style={{ width: "100%", padding: 10, margin: "8px 0", border: "1px solid #555", borderRadius: 6, background: "#111", color: "#fff" }}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={auth.password}
                  onChange={(e) => setAuth({ username: auth.username, password: e.target.value })}
                  style={{ width: "100%", padding: 10, margin: "8px 0", border: "1px solid #555", borderRadius: 6, background: "#111", color: "#fff" }}
                />
                <button style={styles.primary} onClick={handleLogin}>Login</button>
                <button style={styles.secondary} onClick={handleSignup}>Signup</button>
              </div>
            ) : (
              <div style={styles.card}>
                <h3>Welcome, {user.username}</h3>
                <button style={styles.secondary} onClick={handleEditProfile}>Edit Profile</button>
                <button style={styles.danger} onClick={handleLogout}>Logout</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}