import { useState } from "react";

interface ExperienceLevel {
  id: number;
  title: string;
  icon: string;
}

interface ExperienceLevelCardProps {
  data: ExperienceLevel;
}

export default function ExperienceLevelCard({
  data,
}: ExperienceLevelCardProps) {
  const [activeSector, setActiveSector] = useState<number | null>(1); // Initialize with ID 1 for "Entry" level

  function toggleActive(id: number) {
    if (id === activeSector) {
      // If the same box is clicked again, deselect it
      setActiveSector(null);
    } else {
      setActiveSector(id);
    }
  }

  return (
    <>
      <div
        className={`experience-box ${
          data.id === activeSector
            ? "active"
            : "shadow-[0px_2px_10px_rgba(3,3,3,0.1)]"
        } ${data.title === "Mid level" ? "col-span-2" : ""}`}
        onClick={() => toggleActive(data.id)}>
        <img src={data.icon} alt='' className='w-[20px] h-[20px] ' />
        <h1 className='font-bold text-primary text-base pt-2 '>
          {data?.title}
        </h1>
      </div>
    </>
  );
}
