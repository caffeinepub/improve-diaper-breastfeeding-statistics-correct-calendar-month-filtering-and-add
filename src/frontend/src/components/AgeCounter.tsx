import { Calendar } from "lucide-react";
import React, { useState, useEffect } from "react";

interface AgeCounterProps {
  birthDate: bigint;
}

export default function AgeCounter({ birthDate }: AgeCounterProps) {
  const [age, setAge] = useState<string>("");

  useEffect(() => {
    const calculateAge = () => {
      const birthTimestamp = Number(birthDate) / 1_000_000; // Convert nanoseconds to milliseconds
      const now = Date.now();
      const diff = now - birthTimestamp;

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setAge(`${days} d. ${hours} val. ${minutes} min.`);
      } else if (hours > 0) {
        setAge(`${hours} val. ${minutes} min. ${seconds} sek.`);
      } else if (minutes > 0) {
        setAge(`${minutes} min. ${seconds} sek.`);
      } else {
        setAge(`${seconds} sek.`);
      }
    };

    calculateAge();
    const interval = setInterval(calculateAge, 1000);

    return () => clearInterval(interval);
  }, [birthDate]);

  return (
    <div className="flex items-center gap-2 text-lg font-semibold">
      <Calendar className="h-5 w-5 text-primary" />
      <span className="bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
        {age}
      </span>
    </div>
  );
}
