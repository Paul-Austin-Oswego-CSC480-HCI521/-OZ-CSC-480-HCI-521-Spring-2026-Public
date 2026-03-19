import { NotifCenter } from "@/components/custom/screen/home/NotifCenter";
import Welcome from "@/components/custom/screen/home/Welcome";

const TaskTracker = () => {
  return (
    <div className="w-full m-10">
      <Welcome />
      <NotifCenter />
    </div>
  );
};

export default TaskTracker;
