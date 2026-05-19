import { create } from "zustand";

const defaultModalState = {
  visible: false,
  title: "",
  description: "",
  reward: null,
  rewards: [],
  button: null,
  buttons: null,
  closable: true,
};

export const useModalStore = create((set) => ({
  /* -------------------------------------------------------------------------- */
  /* State                                                                      */
  /* -------------------------------------------------------------------------- */

  modal: defaultModalState,
  loadingVisible: false,

  /* -------------------------------------------------------------------------- */
  /* Modal Actions                                                              */
  /* -------------------------------------------------------------------------- */

  showModal: (config = {}, sound = null) => {
    // Parameter sound dipertahankan agar kompatibel dengan API lama,
    // walaupun saat ini belum digunakan.
    const play = sound;
    void play;

    set({
      modal: {
        ...defaultModalState,
        ...config,
        visible: true,
      },
    });
  },

  hideModal: () => {
    set((state) => ({
      modal: {
        ...state.modal,
        visible: false,
      },
    }));
  },

  /* -------------------------------------------------------------------------- */
  /* Loading Overlay Actions                                                    */
  /* -------------------------------------------------------------------------- */

  showLoading: () => {
    set({
      loadingVisible: true,
    });
  },

  hideLoading: () => {
    set({
      loadingVisible: false,
    });
  },

  /* -------------------------------------------------------------------------- */
  /* Utility                                                                    */
  /* -------------------------------------------------------------------------- */

  resetModal: () => {
    set({
      modal: defaultModalState,
    });
  },
}));
