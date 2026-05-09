import { useState, useEffect, useCallback } from "react";
import "./PokeMartPanel.css";
import { SHOP_ITEMS } from "../game/shopData";
import { canAfford, buyItem } from "../game/shopLogic";
import { ITEMS } from "../game/inventory";

export default function PokeMartPanel({ inventory, setInventory, money, setMoney, onClose }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [message, setMessage] = useState("");

  const handleBuy = useCallback(() => {
    const entry = SHOP_ITEMS[selectedIndex];
    if (!entry) return;

    const { itemId, price } = entry;

    if (!canAfford(money, price)) {
      setMessage("Not enough money!");
      return;
    }

    const result = buyItem({ inventory, money, itemId, price });

    if (result.success) {
      setInventory(result.inventory);
      setMoney(result.money);
      setMessage(`Bought 1 ${ITEMS[itemId]?.name ?? itemId}!`);
    } else {
      setMessage("Purchase failed.");
    }
  }, [selectedIndex, inventory, money, setInventory, setMoney]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((s) => Math.min(SHOP_ITEMS.length - 1, s + 1));
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((s) => Math.max(0, s - 1));
      }

      if (e.key === "Enter") {
        e.preventDefault();
        handleBuy();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, handleBuy]);

  return (
    <div className="pokemart-screen" role="dialog" aria-modal="true">
      <div className="pokemart-frame">
        <header className="pokemart-header">
          <div className="pokemart-header-left">
            <div className="pokemart-pokeball" />
            <div className="pokemart-title">
              <h2>POKÉ MART</h2>
              <p>Welcome! May I help you?</p>
            </div>
          </div>
          <div className="pokemart-header-right">
            <div className="pokemart-money">₽ {money}</div>
            <button className="pokemart-exit" onClick={onClose}>Exit</button>
          </div>
        </header>

        <main className="pokemart-main">
          <aside className="pokemart-list" role="list">
            {SHOP_ITEMS.map((it, idx) => {
              const owned = inventory?.[it.itemId] ?? 0;
              const isSelected = idx === selectedIndex;
              const meta = ITEMS[it.itemId] || {};

              return (
                <div
                  key={it.itemId}
                  className={`pokemart-item ${isSelected ? "selected" : ""}`}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  onClick={() => setSelectedIndex(idx)}
                >
                  <div className="pokemart-item-icon">
                    {meta.icon && (
                      <img src={meta.icon} alt={meta.name} width={24} height={24} style={{ imageRendering: "pixelated" }} />
                    )}
                  </div>
                  <div className="pokemart-item-name">{meta.name ?? it.itemId}</div>
                  <div className="pokemart-item-price">₽ {it.price}</div>
                  <div className="pokemart-item-owned">× {owned}</div>
                </div>
              );
            })}
          </aside>

          <section className="pokemart-detail">
            {SHOP_ITEMS[selectedIndex] && (
              <div className="pokemart-detail-inner">
                <div className="pokemart-detail-icon">
                  {(ITEMS[SHOP_ITEMS[selectedIndex].itemId]?.icon) && (
                    <img
                      src={ITEMS[SHOP_ITEMS[selectedIndex].itemId].icon}
                      alt={ITEMS[SHOP_ITEMS[selectedIndex].itemId].name}
                      width={56}
                      height={56}
                      style={{ imageRendering: "pixelated" }}
                    />
                  )}
                </div>
                <h3>{ITEMS[SHOP_ITEMS[selectedIndex].itemId]?.name}</h3>
                <p className="pokemart-detail-desc">{SHOP_ITEMS[selectedIndex].description}</p>
                <div className="pokemart-detail-meta">
                  <div>Price: ₽ {SHOP_ITEMS[selectedIndex].price}</div>
                  <div>Owned: {inventory?.[SHOP_ITEMS[selectedIndex].itemId] ?? 0}</div>
                </div>

                <div className="pokemart-detail-actions">
                  <button className="pokemart-buy" onClick={handleBuy}>Buy 1</button>
                </div>
              </div>
            )}
          </section>
        </main>

        <footer className="pokemart-footer">
          <div className="pokemart-footer-left">{message}</div>
          <div className="pokemart-footer-right">Press Esc to exit</div>
        </footer>
      </div>
    </div>
  );
}
