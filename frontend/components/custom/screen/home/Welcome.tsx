import { Card } from "@/components/ui/card";


const Welcome = () => {
  return (
    <div className="w-full space-y-6">
      <h1 className="text-4xl font-semibold">Welcome, Student.</h1>
      <p className="text-lg">
        The next weekly work log is due{" "}
        <span className="underline">Monday, xx, xx, xxxx</span>.
      </p>
      <Card className="w-full cursor-pointer hover:bg-gray-100 transition-colors">
        <div className="py-4 text-center text-xl font-medium">
          Continue This Week's Work Log
        </div>
      </Card>
    </div>
  );
};

export default Welcome;
