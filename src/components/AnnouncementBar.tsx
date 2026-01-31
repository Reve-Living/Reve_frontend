import { motion } from 'framer-motion';

const AnnouncementBar = () => {
  return (
    <motion.div
      initial={{ y: -40 }}
      animate={{ y: 0 }}
      className="gradient-bronze py-2.5 text-center"
    >
      <p className="text-sm font-medium text-primary-foreground">
        🇬🇧 UK Handcrafted Beds &amp; Free Delivery on Orders Over £500
      </p>
    </motion.div>
  );
};

export default AnnouncementBar;
