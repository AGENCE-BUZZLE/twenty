import { Img } from '@react-email/components';

const logoStyle = {
  marginBottom: '40px',
};

export const Logo = () => {
  return (
    <Img
      src="https://home.agence-buzzle.com/images/buzzle-dark.png"
      alt="Buzzle"
      width="140"
      height="50"
      style={logoStyle}
    />
  );
};
