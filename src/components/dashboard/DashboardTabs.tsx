import React, { useState } from "react";
import PhotographyUploader from "./PhotographyUploader";
import CloudinaryManagementGrid from "./CloudinaryManagementGrid";
import ToggleTrack, { type ToggleTrackOption } from "../ToggleTrack";

type DashboardTab = "upload" | "management";

const dashboardTabs: readonly ToggleTrackOption<DashboardTab>[] = [
  { value: "upload", label: "Upload" },
  { value: "management", label: "Management" },
];

const DashboardTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<DashboardTab>("upload");
  const isUpload = activeTab === "upload";

  return (
    <div className="relative rounded-xl border border-white/10 bg-[rgba(24,24,24,0.5)] p-8">
      <div className="mb-8 flex flex-col items-start gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="m-0 text-2xl font-semibold text-white text-left">
            {isUpload ? "Uploads" : "Management"}
          </h2>
          <p className="mt-2 ml-0 max-w-2xl text-sm text-zinc-400">
            {isUpload
              ? 'Upload images. Check "Featured Photography" to mark photos for the featured gallery.'
              : "Browse currently uploaded Cloudinary images and delete assets directly from the site."}
          </p>
        </div>

        <ToggleTrack
          aria-label="Dashboard section"
          options={dashboardTabs}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      {isUpload ? <PhotographyUploader /> : <CloudinaryManagementGrid />}
    </div>
  );
};

export default DashboardTabs;
