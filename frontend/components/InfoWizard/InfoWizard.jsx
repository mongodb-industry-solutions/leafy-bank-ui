"use client";

import React from "react";
import Modal from "@leafygreen-ui/modal";
import { H3, Body } from "@leafygreen-ui/typography";
import Tooltip from "@leafygreen-ui/tooltip";
import Icon from "@leafygreen-ui/icon";
import IconButton from "@leafygreen-ui/icon-button";
import PropTypes from "prop-types";
import styles from "./InfoWizard.module.css";

const InfoWizard = ({
  open,
  setOpen,
  tooltipText = "Learn more",
  iconGlyph = "Wizard",
  title,
  body,
  sections = [],
}) => {
  return (
    <>
      <Tooltip
        trigger={
          <IconButton onClick={() => setOpen((prev) => !prev)}>
            <Icon glyph={iconGlyph} />
          </IconButton>
        }
      >
        {tooltipText}
      </Tooltip>
      <Modal open={open} setOpen={setOpen} className={styles.modal}>
        <div className={styles.modalContent}>
          {title && <H3 className={styles.modalH3}>{title}</H3>}
          {body && <Body>{body}</Body>}
          {sections.map((section, index) => (
            <div key={index} className={styles.section}>
              {section.heading && <H3 className={styles.modalH3}>{section.heading}</H3>}
              {section.body && <Body>{section.body}</Body>}
              {section.image && (
                <img
                  src={section.image.src}
                  alt={section.image.alt}
                  width={section.image.width || 550}
                  className={styles.modalImage}
                />
              )}
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
};

InfoWizard.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  tooltipText: PropTypes.string,
  iconGlyph: PropTypes.string,
  title: PropTypes.string,
  body: PropTypes.string,
  sections: PropTypes.arrayOf(
    PropTypes.shape({
      heading: PropTypes.string,
      body: PropTypes.string,
      image: PropTypes.shape({
        src: PropTypes.string.isRequired,
        alt: PropTypes.string.isRequired,
        width: PropTypes.number,
      }),
    })
  ),
};

export default InfoWizard;
