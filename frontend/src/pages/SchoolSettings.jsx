import { useState, useEffect } from "react";
import { Building2, Upload, Trash2, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const API_BASE_URL = "http://localhost:5000";

const SchoolSettings = () => {
  const [settings, setSettings] = useState({
    school_name: "",
    school_address: "",
    school_phone: "",
    school_email: "",
    school_website: "",
    principal_name: "",
    school_logo_path: null,
    school_seal_path: null,
    principal_signature_path: null,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingSeal, setUploadingSeal] = useState(false);
  const [uploadingSignature, setUploadingSignature] = useState(false);

  const getAuthHeaders = () => {
    let token = localStorage.getItem("token");
    if (!token) {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          token = userObj.token || userObj.accessToken;
        } catch (e) {}
      }
    }
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchSchoolSettings();
  }, []);

  const fetchSchoolSettings = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/school-settings`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          toast.error("School settings not found. Please run migration.");
          return;
        }
        throw new Error("Failed to fetch settings");
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error("Error fetching school settings:", error);
      toast.error("Failed to load school settings");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/school-settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          school_name: settings.school_name,
          school_address: settings.school_address,
          school_phone: settings.school_phone,
          school_email: settings.school_email,
          school_website: settings.school_website,
          principal_name: settings.principal_name,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update settings");
      }

      const data = await response.json();
      setSettings(data.data);
      toast.success("School settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error(error.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append(type, file);

    const setters = {
      logo: setUploadingLogo,
      seal: setUploadingSeal,
      signature: setUploadingSignature,
    };

    setters[type](true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/school-settings/upload-${type}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }

      const data = await response.json();

      // Update the corresponding path in settings
      const pathKey = `${
        type === "signature" ? "principal_signature" : `school_${type}`
      }_path`;
      setSettings((prev) => ({
        ...prev,
        [pathKey]: data[`${type}Path`],
      }));

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} uploaded successfully!`
      );
    } catch (error) {
      console.error(`Error uploading ${type}:`, error);
      toast.error(error.message || `Failed to upload ${type}`);
    } finally {
      setters[type](false);
    }
  };

  const handleFileDelete = async (type) => {
    if (!window.confirm(`Are you sure you want to delete the ${type}?`)) return;

    const setters = {
      logo: setUploadingLogo,
      seal: setUploadingSeal,
      signature: setUploadingSignature,
    };

    setters[type](true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/school-settings/delete-${type}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Delete failed");
      }

      // Update the corresponding path in settings
      const pathKey = `${
        type === "signature" ? "principal_signature" : `school_${type}`
      }_path`;
      setSettings((prev) => ({
        ...prev,
        [pathKey]: null,
      }));

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully!`
      );
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      toast.error(error.message || `Failed to delete ${type}`);
    } finally {
      setters[type](false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              School Settings
            </h1>
            <p className="text-sm text-gray-500">
              Manage your school's basic information and assets
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
      >
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Basic Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              School Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="school_name"
              value={settings.school_name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter school name"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Principal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="principal_name"
              value={settings.principal_name}
              onChange={handleInputChange}
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Enter principal name"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">
            School Address <span className="text-red-500">*</span>
          </label>
          <textarea
            name="school_address"
            value={settings.school_address}
            onChange={handleInputChange}
            required
            rows="2"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Enter complete address"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Phone
            </label>
            <input
              type="text"
              name="school_phone"
              value={settings.school_phone || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="01-1234567"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              name="school_email"
              value={settings.school_email || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="info@school.edu.np"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Website
            </label>
            <input
              type="url"
              name="school_website"
              value={settings.school_website || ""}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="www.school.edu.np"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {/* School Assets */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-4">School Assets</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* School Logo */}
          <AssetUploader
            title="School Logo"
            currentPath={settings.school_logo_path}
            type="logo"
            uploading={uploadingLogo}
            onUpload={handleFileUpload}
            onDelete={handleFileDelete}
          />

          {/* School Seal */}
          <AssetUploader
            title="School Seal"
            currentPath={settings.school_seal_path}
            type="seal"
            uploading={uploadingSeal}
            onUpload={handleFileUpload}
            onDelete={handleFileDelete}
          />

          {/* Principal Signature */}
          <AssetUploader
            title="Principal Signature"
            currentPath={settings.principal_signature_path}
            type="signature"
            uploading={uploadingSignature}
            onUpload={handleFileUpload}
            onDelete={handleFileDelete}
          />
        </div>
      </div>
    </div>
  );
};

// Asset Uploader Component
const AssetUploader = ({
  title,
  currentPath,
  type,
  uploading,
  onUpload,
  onDelete,
}) => {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onUpload(file, type);
    }
    e.target.value = ""; // Reset input
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition">
      <h3 className="font-semibold text-gray-700 mb-3 text-center">{title}</h3>

      {currentPath ? (
        <div className="space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-center">
            <img
              src={`${API_BASE_URL}${currentPath}`}
              alt={title}
              className="max-h-32 max-w-full object-contain"
            />
          </div>

          <div className="flex gap-2">
            <label className="flex-1 cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <div className="bg-blue-50 text-blue-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition text-center flex items-center justify-center gap-2">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                Replace
              </div>
            </label>

            <button
              onClick={() => onDelete(type)}
              disabled={uploading}
              className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition flex items-center gap-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <label className="cursor-pointer block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <div className="bg-gray-50 rounded-lg p-8 text-center hover:bg-gray-100 transition">
            {uploading ? (
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            )}
            <p className="text-sm text-gray-600 font-medium">
              {uploading ? "Uploading..." : "Click to upload"}
            </p>
            <p className="text-xs text-gray-400 mt-1">Max 5MB</p>
          </div>
        </label>
      )}
    </div>
  );
};

export default SchoolSettings;
