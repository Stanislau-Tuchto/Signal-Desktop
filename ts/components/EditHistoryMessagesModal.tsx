// Copyright 2023 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useCallback, useState, useRef } from 'react';
import { noop } from 'lodash';

import type { AttachmentType } from '../types/Attachment';
import type { LocalizerType } from '../types/Util';
import type { MessagePropsType } from '../state/selectors/message';
import type { PreferredBadgeSelectorType } from '../state/selectors/badges';
import { Message, TextDirection } from './conversation/Message';
import { Modal } from './Modal';
import { WidthBreakpoint } from './_util';
import { shouldNeverBeCalled } from '../util/shouldNeverBeCalled';
import { useTheme } from '../hooks/useTheme';
import { isSameDay } from '../util/timestamp';
import { TimelineDateHeader } from './conversation/TimelineDateHeader';

export type PropsType = {
  closeEditHistoryModal: () => unknown;
  editHistoryMessages: Array<MessagePropsType>;
  getPreferredBadge: PreferredBadgeSelectorType;
  i18n: LocalizerType;
  platform: string;
  kickOffAttachmentDownload: (options: {
    attachment: AttachmentType;
    messageId: string;
  }) => void;
  showLightbox: (options: {
    attachment: AttachmentType;
    messageId: string;
  }) => void;
};

const MESSAGE_DEFAULT_PROPS = {
  canDeleteForEveryone: false,
  checkForAccount: shouldNeverBeCalled,
  clearSelectedMessage: shouldNeverBeCalled,
  clearTargetedMessage: shouldNeverBeCalled,
  containerWidthBreakpoint: WidthBreakpoint.Medium,
  doubleCheckMissingQuoteReference: shouldNeverBeCalled,
  interactionMode: 'mouse' as const,
  isBlocked: false,
  isMessageRequestAccepted: true,
  markAttachmentAsCorrupted: shouldNeverBeCalled,
  messageExpanded: shouldNeverBeCalled,
  onReplyToMessage: shouldNeverBeCalled,
  onToggleSelect: shouldNeverBeCalled,
  openGiftBadge: shouldNeverBeCalled,
  openLink: shouldNeverBeCalled,
  previews: [],
  retryMessageSend: shouldNeverBeCalled,
  pushPanelForConversation: shouldNeverBeCalled,
  renderAudioAttachment: () => <div />,
  renderingContext: 'EditHistoryMessagesModal',
  saveAttachment: shouldNeverBeCalled,
  scrollToQuotedMessage: shouldNeverBeCalled,
  shouldCollapseAbove: false,
  shouldCollapseBelow: false,
  shouldHideMetadata: false,
  showContactModal: shouldNeverBeCalled,
  showConversation: noop,
  showEditHistoryModal: shouldNeverBeCalled,
  showExpiredIncomingTapToViewToast: shouldNeverBeCalled,
  showExpiredOutgoingTapToViewToast: shouldNeverBeCalled,
  showLightboxForViewOnceMedia: shouldNeverBeCalled,
  startConversation: shouldNeverBeCalled,
  textDirection: TextDirection.Default,
  viewStory: shouldNeverBeCalled,
};

export function EditHistoryMessagesModal({
  closeEditHistoryModal,
  getPreferredBadge,
  editHistoryMessages,
  i18n,
  platform,
  kickOffAttachmentDownload,
  showLightbox,
}: PropsType): JSX.Element {
  const containerElementRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();

  const closeAndShowLightbox = useCallback(
    (options: { attachment: AttachmentType; messageId: string }) => {
      closeEditHistoryModal();
      showLightbox(options);
    },
    [closeEditHistoryModal, showLightbox]
  );

  // These states aren't in redux; they are meant to last only as long as this dialog.
  const [revealedSpoilersById, setRevealedSpoilersById] = useState<
    Record<string, Record<number, boolean> | undefined>
  >({});
  const [displayLimitById, setDisplayLimitById] = useState<
    Record<string, number | undefined>
  >({});

  const [currentMessage, ...pastEdits] = editHistoryMessages;
  const currentMessageId = `${currentMessage.id}.${currentMessage.timestamp}`;

  return (
    <Modal
      hasXButton
      i18n={i18n}
      modalName="EditHistoryMessagesModal"
      moduleClassName="EditHistoryMessagesModal"
      onClose={closeEditHistoryModal}
      noTransform
    >
      <div ref={containerElementRef}>
        <Message
          {...MESSAGE_DEFAULT_PROPS}
          {...currentMessage}
          id={currentMessageId}
          containerElementRef={containerElementRef}
          displayLimit={displayLimitById[currentMessageId]}
          getPreferredBadge={getPreferredBadge}
          i18n={i18n}
          isSpoilerExpanded={revealedSpoilersById[currentMessageId] || {}}
          key={currentMessage.timestamp}
          kickOffAttachmentDownload={kickOffAttachmentDownload}
          messageExpanded={(messageId, displayLimit) => {
            const update = {
              ...displayLimitById,
              [messageId]: displayLimit,
            };
            setDisplayLimitById(update);
          }}
          platform={platform}
          showLightbox={closeAndShowLightbox}
          showSpoiler={(messageId, data) => {
            const update = {
              ...revealedSpoilersById,
              [messageId]: data,
            };
            setRevealedSpoilersById(update);
          }}
          theme={theme}
        />

        <hr className="EditHistoryMessagesModal__divider" />

        <h3 className="EditHistoryMessagesModal__title">
          {i18n('icu:EditHistoryMessagesModal__title')}
        </h3>

        {pastEdits.map((messageAttributes, index) => {
          const syntheticId = `${messageAttributes.id}.${messageAttributes.timestamp}`;

          const previousItem = pastEdits[index - 1];

          const shouldShowDateHeader = Boolean(
            !previousItem ||
              // This comparison avoids strange header behavior for out-of-order messages.
              (messageAttributes.timestamp > previousItem.timestamp &&
                !isSameDay(previousItem.timestamp, messageAttributes.timestamp))
          );
          const dateHeaderElement = shouldShowDateHeader ? (
            <TimelineDateHeader
              i18n={i18n}
              timestamp={messageAttributes.timestamp}
            />
          ) : null;

          return (
            <React.Fragment key={messageAttributes.timestamp}>
              {dateHeaderElement}
              <Message
                {...MESSAGE_DEFAULT_PROPS}
                {...messageAttributes}
                id={syntheticId}
                containerElementRef={containerElementRef}
                displayLimit={displayLimitById[syntheticId]}
                getPreferredBadge={getPreferredBadge}
                i18n={i18n}
                isSpoilerExpanded={revealedSpoilersById[syntheticId] || {}}
                kickOffAttachmentDownload={kickOffAttachmentDownload}
                messageExpanded={(messageId, displayLimit) => {
                  const update = {
                    ...displayLimitById,
                    [messageId]: displayLimit,
                  };
                  setDisplayLimitById(update);
                }}
                platform={platform}
                showLightbox={closeAndShowLightbox}
                showSpoiler={(messageId, data) => {
                  const update = {
                    ...revealedSpoilersById,
                    [messageId]: data,
                  };
                  setRevealedSpoilersById(update);
                }}
                theme={theme}
              />
            </React.Fragment>
          );
        })}
      </div>
    </Modal>
  );
}
