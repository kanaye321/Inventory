import { Button } from "@/components/ui/button";

interface CheckinFormProps {
  onSubmit: () => void;
  isLoading: boolean;
  assetName: string;
  userName: string;
}

export default function CheckinForm({ 
  onSubmit, 
  isLoading,
  assetName,
  userName
}: CheckinFormProps) {
  return (
    <div className="space-y-6">
      <div className="p-4 border rounded-md bg-blue-50">
        <p className="text-blue-800 font-medium">Asset: {assetName}</p>
        <p className="text-blue-600 text-sm mt-1">Currently assigned to: {userName}</p>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
        <h4 className="font-medium text-yellow-800 mb-1">Confirm Check-in</h4>
        <p className="text-yellow-700 text-sm">
          Are you sure you want to check in this asset? The asset will be marked as available
          and will no longer be assigned to the current user.
        </p>
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={isLoading}>
          {isLoading ? "Processing..." : "Check In Asset"}
        </Button>
      </div>
    </div>
  );
}
