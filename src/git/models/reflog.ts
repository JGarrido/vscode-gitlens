import { DateStyle } from '../../config';
import { formatDate, fromNow } from '../../system/date';
import { memoize } from '../../system/decorators/memoize';
import { CommitDateFormatting, GitRevision } from '../models';

export interface GitReflog {
	readonly repoPath: string;
	readonly records: GitReflogRecord[];

	readonly count: number;
	readonly total: number;
	readonly limit: number | undefined;
	readonly hasMore: boolean;
	more?(limit: number | undefined): Promise<GitReflog | undefined>;
}

export class GitReflogRecord {
	private _previousSha: string | undefined;

	constructor(
		public readonly repoPath: string,
		public readonly sha: string,
		private _selector: string,
		public readonly date: Date,
		public readonly command: string,
		public readonly commandArgs: string | undefined,
		public readonly details: string | undefined,
	) {}

	@memoize<GitReflogRecord['formatDate']>(format => (format == null ? 'MMMM Do, YYYY h:mma' : format))
	formatDate(format?: string | null) {
		return formatDate(this.date, format ?? 'MMMM Do, YYYY h:mma');
	}

	formatDateFromNow() {
		return fromNow(this.date);
	}

	get formattedDate(): string {
		return CommitDateFormatting.dateStyle === DateStyle.Absolute
			? this.formatDate(CommitDateFormatting.dateFormat)
			: this.formatDateFromNow();
	}

	@memoize()
	get HEAD() {
		if (this._selector == null || this._selector.length === 0) return '';

		if (this._selector.startsWith('refs/heads')) {
			return this._selector.substr(11);
		}

		if (this._selector.startsWith('refs/remotes')) {
			return this._selector.substr(13);
		}

		return this._selector;
	}

	get previousSha() {
		return this._previousSha;
	}

	@memoize()
	get previousShortSha() {
		return GitRevision.shorten(this._previousSha);
	}

	get selector() {
		return this._selector;
	}

	@memoize()
	get shortSha() {
		return GitRevision.shorten(this.sha);
	}

	update(previousSha?: string, selector?: string) {
		if (previousSha !== undefined) {
			this._previousSha = previousSha;
		}
		if (selector !== undefined) {
			this._selector = selector;
		}
	}
}
