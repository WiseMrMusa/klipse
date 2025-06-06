"use client";
import { useState } from "react";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [buildCmd, setBuildCmd] = useState("npm run build");
  const [buildDir, setBuildDir] = useState(".next");
  const [installCmd, setInstallCmd] = useState("npm install");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [uploadId, setUploadId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    setSuccess("");
    setUploadId("");

    try {
      // Basic validation for GitHub URL
      if (!repoUrl.includes("github.com")) {
        throw new Error("Please enter a valid GitHub repository URL");
      }

      const response = await fetch('http://localhost:3005/process', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          repoUrl,
          buildCmd,
          buildDir,
          installCmd
        })
      });

      if (!response.ok) {
        throw new Error('Failed to process repository');
      }

      const data = await response.json();
      setUploadId(data.uploadId);
      setSuccess("Repository submitted successfully! Upload ID: " + data.uploadId);
      setRepoUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Deploy Your GitHub Repository
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Enter your GitHub repository URL to start the deployment process
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GitHub Repository URL
            </label>
            <input
              type="text"
              id="repoUrl"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/username/repository"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="buildCmd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Build Command
            </label>
            <input
              type="text"
              id="buildCmd"
              value={buildCmd}
              onChange={(e) => setBuildCmd(e.target.value)}
              placeholder="npm run build"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="buildDir" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Build Directory
            </label>
            <input
              type="text"
              id="buildDir"
              value={buildDir}
              onChange={(e) => setBuildDir(e.target.value)}
              placeholder=".next"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="installCmd" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Install Command
            </label>
            <input
              type="text"
              id="installCmd"
              value={installCmd}
              onChange={(e) => setInstallCmd(e.target.value)}
              placeholder="npm install"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          {success && (
            <div className="text-green-500 text-sm">{success}</div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Deploying..." : "Deploy Repository"}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Example: https://github.com/username/repository</p>
        </div>
      </div>
    </div>
  );
}
