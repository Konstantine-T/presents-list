import { sectionTitles } from "./gifts";
import Linkified from "./Linkified";
import { useGifts, useReservations } from "./reservations";

export default function PublicPage() {
  const { gifts, loading: giftsLoading, error: giftsError } = useGifts();
  const { reserved, toggle, loading, error } = useReservations();
  const birthdayGifts = gifts.filter((g) => g.section === "birthday");
  const abroadGifts = gifts.filter((g) => g.section === "abroad");

  return (
    <main>
      <h1>{sectionTitles.birthday}</h1>
      {(error || giftsError) && (
        <p className="warn">შეცდომა: {error || giftsError}</p>
      )}
      {giftsLoading && <p className="hint">იტვირთება...</p>}

      <ul className="gifts">
        {birthdayGifts.map((gift) => {
          const isReserved = reserved.has(gift.id);
          return (
            <li key={gift.id} className={isReserved ? "reserved" : undefined}>
              <label>
                <input
                  type="checkbox"
                  checked={isReserved}
                  disabled={loading}
                  onChange={() => toggle(gift.id)}
                />
                <span className="text">
                  <Linkified text={gift.text} />
                  {isReserved && <span className="badge">ვყიდულობ</span>}
                </span>
              </label>
            </li>
          );
        })}
      </ul>

      <h2>✈️ {sectionTitles.abroad}</h2>
      <ul className="plain">
        {abroadGifts.map((gift) => (
          <li key={gift.id}>
            <Linkified text={gift.text} />
          </li>
        ))}
      </ul>
    </main>
  );
}
