import { Card } from "@/components/ui/card";

const Welcome = () => {
  return (
    <div className="w-full space-y-6 pr-15">
      <h1 className="text-4xl">Welcome, Student.</h1>
      <p className="text-lg">
        The next weekly work log is due{" "}
        <span className="underline">Monday, xx, xx, xxxx</span>.
      </p>
      <Card className="w-full cursor-pointer hover:bg-gray-100 transition-colors mr-10 ">
        <div className="py-4 text-center text-xl font-medium mr-10 ">
          Continue This Week's Work Log
        </div>
      </Card>
    </div>
  );
};

export default Welcome;
