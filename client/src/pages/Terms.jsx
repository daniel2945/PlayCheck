export default function Terms() {
  return (
    <div className="pt-20 sm:pt-32 px-4 sm:px-6 max-w-4xl mx-auto min-h-screen text-[#e8eaed] pb-24">
      <h1 className="text-3xl sm:text-4xl font-bold mb-6 sm:mb-8 text-[#8ab4f8]">
        Terms of Service
      </h1>

      <div className="space-y-6 text-lg leading-relaxed text-[#9aa0a6]">
        <p>
          Welcome to <span className="text-white font-semibold">PlayCheck</span>
          . By accessing or using our website, you agree to be bound by these
          Terms of Service.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
          1. Acceptance of Terms
        </h2>
        <p>
          By creating an account, running hardware checks, or browsing our
          catalog, you confirm that you have read and agree to these terms.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
          2. Service Description
        </h2>
        <p>
          PlayCheck provides estimated compatibility analysis between
          user-provided hardware specifications and video game requirements.
          While we strive for accuracy, we do not guarantee that a game will run
          flawlessly based on our analysis, as performance can be affected by
          drivers, background processes, and system health.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
          3. User Data
        </h2>
        <p>
          If you choose to create an account or use our temporary guest
          analysis, you agree to provide accurate hardware information. You are
          responsible for maintaining the confidentiality of your account
          credentials.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
          4. Limitation of Liability
        </h2>
        <p>
          PlayCheck is not responsible for any software issues, game crashes, or
          hardware damage that may occur on your device. Purchases made based on
          our compatibility scores are at your own risk.
        </p>
      </div>
    </div>
  );
}
