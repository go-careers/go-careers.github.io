import moneyIcon from "../../../../assets/profile-page-assets/money-icon.png";

const JoinNowCard: React.FC = () => {
  return (
    <>
      <div className='profile-join-now-card'>
        {/* Money Icon */}
        <div>
          <img src={moneyIcon} alt='' />
        </div>

        {/* Profile Card Heading */}
        <h5 className='text-primary text-base font-semibold pt-6 '>
          Hey there!
        </h5>

        <div>
          <p className='text-primary text-sm font-light pt-2'>
            Want exclusive job offers and top salaries for exciting positions?{" "}
          </p>

          <p className='text-primary text-sm font-light pt-4'>
            {" "}
            Join our Job Club now!
          </p>
        </div>

        <button className='profile-join-now-button '>Join Now</button>
      </div>
    </>
  );
};

export default JoinNowCard;
