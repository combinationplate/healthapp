import Container from "@/components/ui/Container";

const stats = [
  { num: "100%", class: "text-[#6B8AFF]", desc: "Of licensed professionals need CE credits" },
  { num: "20–30", class: "text-[#5EEAD4]", desc: "Avg CE hours required per renewal" },
  { num: "$0", class: "text-[#FCA5A5]", desc: "What most facilities budget for staff CEs" },
  { num: "30s", class: "text-[#FCD34D]", desc: "To distribute a CE via QR scan" },
];

export default function StatsBanner() {
  return (
    <section className="bg-ink py-14 text-white">
      <Container>
        <div className="grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.desc}>
              <div className={`font-serif text-[44px] font-black ${s.class}`}>
                {s.num}
              </div>
              <div className="text-[14px] font-medium text-white/55">
                {s.desc}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
