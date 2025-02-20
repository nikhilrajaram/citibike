import { CloseCircleOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { Popup as PopupType } from "mapbox-gl";
import { Popup, PopupProps } from "react-map-gl";

type CloseableProps = {
  showCloseButton?: boolean;
  onClose?: () => void;
};

export const CloseablePopup = (
  props: PopupProps & React.RefAttributes<PopupType> & CloseableProps
) => {
  // hijack closeButton and onClose for custom button
  const { children, showCloseButton, closeButton, onClose, ...rest } = props;
  return (
    <Popup
      className="closeable-popup blur-popup blur-border popup-no-tip"
      {...rest}
      closeButton={false}
      closeOnClick={false}
    >
      {showCloseButton && (
        <Button
          onClick={onClose}
          className="absolute top-1 right-1 !bg-transparent border-none cursor-pointer shadow-none"
          icon={<CloseCircleOutlined />}
        ></Button>
      )}
      {children}
    </Popup>
  );
};
