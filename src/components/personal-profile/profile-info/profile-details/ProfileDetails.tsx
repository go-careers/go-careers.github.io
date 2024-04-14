import profileImg from "../../../../assets/profile-page-assets/profile.png";
import InfoForm from "../info-form/InfoForm";
import JoinNowCard from "../join-now-card/JoinNowCard";

const ProfileDetails: React.FC = () => {
  return (
    <>
      <div className='profile-detail-page-container'>
        <div>
          <h2 className='text-primary text-2xl font-semibold '>
            Profile details
          </h2>
          <p className='mt-2 text-sm text-secondary '>Update your info</p>

          {/* Profile Image Start */}
          <div className='mt-8'>
            <img src={profileImg} alt='' />
          </div>

          {/* Profile Info Form */}
          <div className='mt-8'>
            <InfoForm />
          </div>
        </div>
        <JoinNowCard />
      </div>
    </>
  );
};

export default ProfileDetails;
