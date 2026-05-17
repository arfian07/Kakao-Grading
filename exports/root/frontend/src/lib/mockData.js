// Mock data store — semua dummy untuk preview UI
export const initialPrices = {
    mutuI: 92000,
    mutuII: 78000,
    mutuIII: 64000,
};

const grades = ["Mutu I", "Mutu II", "Mutu III"];

export const sampleTransactions = Array.from({ length: 18 }).map((_, i) => {
    const idx = i;
    const grade = grades[idx % 3];
    const weight = (180 + ((idx * 37) % 220)).toFixed(1);
    const beanCount = 90 + ((idx * 13) % 35);
    const priceMap = { "Mutu I": 92000, "Mutu II": 78000, "Mutu III": 64000 };
    const price = Math.round((priceMap[grade] * weight) / 1000);
    const date = new Date(2026, 1, 23 - (idx % 14), 9 + (idx % 9), (idx * 11) % 60);
    return {
        id: `TRX-${String(2026000 + idx).padStart(7, "0")}`,
        date: date.toISOString(),
        weight: parseFloat(weight),
        beanCount,
        grade,
        price,
        moldy: (idx * 3) % 7,
        black: (idx * 2) % 5,
        defective: (idx * 5) % 9,
        totalBeans: 95 + ((idx * 7) % 60),
        fuzzyValue: (0.62 + ((idx % 30) / 100)).toFixed(3),
    };
});

export const formatRupiah = (n) =>
    "Rp " + Number(n).toLocaleString("id-ID");

export const formatDate = (iso) => {
    const d = new Date(iso);
    return (
        d.toLocaleDateString("id-ID", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }) +
        " · " +
        d.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
        })
    );
};

export const generateTrxId = () =>
    `TRX-${String(2026100 + Math.floor(Math.random() * 900)).padStart(7, "0")}`;
