export default function Privacy() {
  return (
    <div className="pt-32 px-6 max-w-4xl mx-auto min-h-screen text-[#e8eaed] pb-24">
      <h1 className="text-4xl font-bold mb-8 text-[#8ab4f8]">Privacy Policy</h1>
      
      <div className="space-y-6 text-lg leading-relaxed text-[#9aa0a6]">
        <p>
          At <span className="text-white font-semibold">PlayCheck</span>, we take your privacy seriously. This policy explains how we collect, use, and protect your information.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">1. Information We Collect</h2>
        <p>
          We collect information you provide directly to us, such as your email address when creating an account, and the hardware specifications (CPU, GPU, RAM) you enter or scan to use our compatibility tools.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">2. How We Use Your Data</h2>
        <p>
          Your hardware data is strictly used to calculate game compatibility. If you are registered, we save this data to your profile so you don't have to re-enter it. We do not sell your personal data or hardware profiles to third-party advertisers.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">3. Cookies and Local Storage</h2>
        <p>
          We use local storage and essential cookies to keep you logged in and to remember your guest PC setup across different game pages during your session.
        </p>

        <h2 className="text-2xl font-semibold text-white mt-8 mb-4">4. Data Security</h2>
        <p>
          We implement standard security measures to protect your account. Passwords are encrypted in our database, and communication between your browser and our servers is secured.
        </p>
      </div>
    </div>
  );
}