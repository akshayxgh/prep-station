type StatCardProps = {
  title: string;
  value: string;
};

export default function StatCard({
  title,
  value,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <p className="text-slate-500 text-sm">
        {title}
      </p>

      <h2 className="text-3xl font-bold mt-2 text-slate-800">
        {value}
      </h2>
    </div>
  );
}